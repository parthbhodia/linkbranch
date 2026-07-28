import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ScanItem = {
  id: string;
  type: "Link" | "Referral" | "Product" | "Media";
  title: string;
  url: string;
};

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part))) {
    return true;
  }
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) return isPrivateIpv4(address);
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    if (isIP(mapped) === 4) return isPrivateIpv4(mapped);
  }
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("2001:db8:")
  );
}

async function safePublicUrl(value: string) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Unsupported protocol");
  }
  if (
    url.hostname === "localhost" ||
    url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".local")
  ) {
    throw new Error("Private host");
  }
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) {
    throw new Error("Private address");
  }
  return url;
}

async function fetchPublicUrl(
  initialUrl: URL,
  method: "HEAD" | "GET",
) {
  let current = initialUrl;
  for (let redirect = 0; redirect < 5; redirect += 1) {
    current = await safePublicUrl(current.href);
    const response = await fetch(current, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(6500),
      headers: {
        "User-Agent": "Cueful-Link-Health/1.0",
        ...(method === "GET" ? { Range: "bytes=0-0" } : {}),
      },
    });
    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.has("location")
    ) {
      current = new URL(response.headers.get("location")!, current);
      continue;
    }
    return response;
  }
  throw new Error("Too many redirects");
}

async function checkItem(item: ScanItem) {
  try {
    const url = await safePublicUrl(item.url);
    let response = await fetchPublicUrl(url, "HEAD");
    if (response.status === 405 || response.status === 501) {
      response = await fetchPublicUrl(url, "GET");
    }
    return {
      ...item,
      status:
        response.status >= 200 && response.status < 400
          ? ("healthy" as const)
          : ("broken" as const),
      statusCode: response.status,
    };
  } catch {
    return {
      ...item,
      status: "broken" as const,
      statusCode: null,
    };
  }
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const [
    { data: links },
    { data: referrals },
    { data: products },
    { data: media },
  ] = await Promise.all([
    supabase
      .from("links")
      .select("id,title,url")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("referrals")
      .select("id,provider,url")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("products")
      .select("id,title,destination_url")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("media_embeds")
      .select("id,title,url")
      .eq("user_id", user.id)
      .eq("is_active", true),
  ]);

  const items: ScanItem[] = [
    ...(links ?? []).map((item) => ({
      id: `link-${item.id}`,
      type: "Link" as const,
      title: item.title,
      url: item.url,
    })),
    ...(referrals ?? []).map((item) => ({
      id: `referral-${item.id}`,
      type: "Referral" as const,
      title: item.provider,
      url: item.url,
    })),
    ...(products ?? []).map((item) => ({
      id: `product-${item.id}`,
      type: "Product" as const,
      title: item.title,
      url: item.destination_url,
    })),
    ...(media ?? []).map((item) => ({
      id: `media-${item.id}`,
      type: "Media" as const,
      title: item.title,
      url: item.url,
    })),
  ].slice(0, 40);

  const results = await Promise.all(items.map(checkItem));
  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    results,
  });
}
