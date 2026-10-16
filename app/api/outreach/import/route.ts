import { NextResponse } from "next/server";
import {
  fromRedditScan,
  fromTwitterScan,
  normalizePlatform,
  withReplyDrafts,
} from "@/lib/outreach-import";
import type { OutreachImportItem } from "@/lib/outreach";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Body = {
  items?: OutreachImportItem[];
  reddit?: unknown[];
  twitter?: unknown[];
  query?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const collected: OutreachImportItem[] = [];

  if (Array.isArray(body.items)) {
    for (const item of body.items) {
      if (!item?.external_id || !item?.title || !item?.url) continue;
      collected.push({
        ...item,
        platform: normalizePlatform(item.platform) ?? "other",
      });
    }
  }

  if (Array.isArray(body.reddit)) {
    collected.push(
      ...fromRedditScan(body.reddit as Parameters<typeof fromRedditScan>[0]),
    );
  }

  if (Array.isArray(body.twitter)) {
    collected.push(
      ...fromTwitterScan(
        body.twitter as Parameters<typeof fromTwitterScan>[0],
        body.query,
      ),
    );
  }

  if (!collected.length) {
    return NextResponse.json(
      { error: "No valid Reddit or Twitter items to import." },
      { status: 400 },
    );
  }

  const drafted = withReplyDrafts(collected);
  const upsertRows = drafted.map((item) => ({
    platform: item.platform ?? "other",
    external_id: String(item.external_id).slice(0, 120),
    title: item.title.slice(0, 400),
    url: item.url,
    author: item.author ?? null,
    community: item.community ?? null,
    body: (item.body ?? "").slice(0, 8000),
    score: item.score ?? 0,
    comments: item.comments ?? 0,
    target_score: item.target_score ?? 0,
    query: item.query ?? null,
    posted_at: item.posted_at ?? null,
    reply_draft: item.reply_draft ?? "",
    scanned_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("outreach_targets")
    .upsert(upsertRows, { onConflict: "platform,external_id" })
    .select("id,platform,external_id,target_score,status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: data?.length ?? upsertRows.length,
    reddit: upsertRows.filter((r) => r.platform === "reddit").length,
    twitter: upsertRows.filter((r) => r.platform === "twitter").length,
    items: data,
  });
}
