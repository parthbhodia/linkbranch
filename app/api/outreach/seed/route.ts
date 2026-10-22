import seed from "@/lib/outreach-seed-data.json";
import { withReplyDrafts } from "@/lib/outreach-import";
import type { OutreachImportItem } from "@/lib/outreach";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = withReplyDrafts(
    (seed.items as OutreachImportItem[]).map((item) => ({
      ...item,
      platform: item.platform ?? "other",
    })),
  );

  const rows = items.map((item) => ({
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
    .upsert(rows, { onConflict: "platform,external_id" })
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reddit = rows.filter((r) => r.platform === "reddit").length;
  const twitter = rows.filter((r) => r.platform === "twitter").length;

  return NextResponse.json({
    imported: data?.length ?? rows.length,
    reddit,
    twitter,
    items: data,
  });
}
