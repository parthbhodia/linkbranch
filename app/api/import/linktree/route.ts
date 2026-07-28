import { NextResponse, type NextRequest } from "next/server";
import type {
  ImportedLink,
  ImportedProfileDraft,
  ImportedSocial,
} from "@/lib/import-draft";

const MAX_HTML_LENGTH = 2_000_000;
const allowedHosts = new Set(["linktr.ee", "www.linktr.ee"]);
const socialHosts: Array<[string, string]> = [
  ["instagram.com", "Instagram"],
  ["tiktok.com", "TikTok"],
  ["youtube.com", "YouTube"],
  ["youtu.be", "YouTube"],
  ["x.com", "X / Twitter"],
  ["twitter.com", "X / Twitter"],
  ["linkedin.com", "LinkedIn"],
  ["github.com", "GitHub"],
  ["threads.net", "Threads"],
  ["facebook.com", "Facebook"],
  ["pinterest.com", "Pinterest"],
  ["twitch.tv", "Twitch"],
  ["bsky.app", "Bluesky"],
];

function parseAttributes(tag: string) {
  const attributes = new Map<string, string>();
  for (const match of tag.matchAll(
    /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
  )) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? "");
  }
  return attributes;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    );
}

function plainText(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function metaContent(html: string, key: string) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if (
      attributes.get("property") === key ||
      attributes.get("name") === key
    ) {
      return decodeHtml(attributes.get("content") ?? "").trim();
    }
  }
  return "";
}

function safeDestination(value: string) {
  try {
    const url = new URL(decodeHtml(value));
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (allowedHosts.has(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function socialForUrl(value: string): ImportedSocial | null {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    const match = socialHosts.find(([host]) =>
      hostname === host || hostname.endsWith(`.${host}`),
    );
    return match ? { platform: match[1], url: value } : null;
  } catch {
    return null;
  }
}

function collectJsonLinks(
  value: unknown,
  output: Array<{ title: string; url: string }>,
  seen = new Set<unknown>(),
) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);

  if (!Array.isArray(value)) {
    const item = value as Record<string, unknown>;
    const rawUrl =
      typeof item.url === "string"
        ? item.url
        : typeof item.href === "string"
          ? item.href
          : null;
    const rawTitle =
      typeof item.title === "string"
        ? item.title
        : typeof item.name === "string"
          ? item.name
          : null;
    const destination = rawUrl ? safeDestination(rawUrl) : null;
    if (destination && rawTitle?.trim()) {
      output.push({ title: plainText(rawTitle).slice(0, 100), url: destination });
    }
  }

  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    collectJsonLinks(child, output, seen);
  }
}

function extractCandidates(html: string) {
  const candidates: Array<{ title: string; url: string }> = [];
  const nextDataMatch = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (nextDataMatch) {
    try {
      collectJsonLinks(JSON.parse(nextDataMatch[1]), candidates);
    } catch {
      // Anchor extraction below still covers server-rendered Linktree pages.
    }
  }

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attributes = parseAttributes(match[1]);
    const destination = safeDestination(attributes.get("href") ?? "");
    const title = plainText(match[2]);
    if (destination && title) {
      candidates.push({ title: title.slice(0, 100), url: destination });
    }
  }

  return candidates;
}

function normalizeSourceUrl(value: string) {
  const withProtocol = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;
  const url = new URL(withProtocol);
  if (!allowedHosts.has(url.hostname.toLowerCase())) {
    throw new Error("Paste a public linktr.ee profile URL.");
  }

  const username = url.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!username || !/^[a-z0-9._-]{2,40}$/.test(username)) {
    throw new Error("Paste a public Linktree creator profile, not its homepage.");
  }
  url.protocol = "https:";
  url.search = "";
  url.hash = "";
  return { url, username };
}

export async function POST(request: NextRequest) {
  let input = "";
  try {
    const body = (await request.json()) as { url?: unknown };
    input = typeof body.url === "string" ? body.url : "";
  } catch {
    return NextResponse.json({ error: "Enter a Linktree URL." }, { status: 400 });
  }

  let normalized: ReturnType<typeof normalizeSourceUrl>;
  try {
    normalized = normalizeSourceUrl(input);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid URL." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(normalized.url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Cueful Importer/1.0 (+https://cueful.bio)",
      },
    });
    if (!response.ok) {
      throw new Error("That public Linktree page could not be loaded.");
    }

    const contentLength = Number(response.headers.get("content-length") ?? "0");
    if (contentLength > MAX_HTML_LENGTH) {
      throw new Error("That Linktree page is too large to import safely.");
    }
    const html = await response.text();
    if (html.length > MAX_HTML_LENGTH) {
      throw new Error("That Linktree page is too large to import safely.");
    }

    const candidates = extractCandidates(html);
    const seenUrls = new Set<string>();
    const links: ImportedLink[] = [];
    const socials: ImportedSocial[] = [];
    const seenSocials = new Set<string>();

    for (const item of candidates) {
      if (seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);
      const social = socialForUrl(item.url);
      if (social) {
        if (!seenSocials.has(social.platform)) {
          socials.push(social);
          seenSocials.add(social.platform);
        }
      } else if (links.length < 25) {
        links.push(item);
      }
    }

    const ogTitle = metaContent(html, "og:title");
    const pageTitle =
      plainText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")
        .replace(/\s*[|·-]\s*Linktree.*$/i, "")
        .trim();
    const displayName =
      ogTitle.replace(/\s*[|·-]\s*Linktree.*$/i, "").trim() ||
      pageTitle ||
      normalized.username;
    const description =
      metaContent(html, "og:description") ||
      metaContent(html, "description");

    const draft: ImportedProfileDraft = {
      sourceUrl: normalized.url.toString(),
      suggestedUsername: normalized.username
        .replace(/[^a-z0-9_-]/g, "")
        .slice(0, 30),
      displayName: displayName.slice(0, 80),
      bio: description.slice(0, 160),
      links,
      socials: socials.slice(0, 12),
      importedAt: new Date().toISOString(),
    };

    return NextResponse.json(draft, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "That Linktree profile could not be imported.",
      },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
}
