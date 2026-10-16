export type OutreachPlatform = "reddit" | "twitter" | "web" | "other";
export type OutreachStatus =
  | "new"
  | "queued"
  | "replied"
  | "skipped"
  | "won";

export type OutreachTarget = {
  id: string;
  platform: OutreachPlatform;
  external_id: string;
  title: string;
  url: string;
  author: string | null;
  community: string | null;
  body: string;
  score: number;
  comments: number;
  target_score: number;
  status: OutreachStatus;
  notes: string;
  reply_draft: string;
  query: string | null;
  posted_at: string | null;
  scanned_at: string;
  created_at: string;
  updated_at: string;
};

export type OutreachImportItem = {
  platform?: OutreachPlatform;
  external_id: string;
  title: string;
  url: string;
  author?: string | null;
  community?: string | null;
  body?: string;
  score?: number;
  comments?: number;
  target_score?: number;
  query?: string | null;
  posted_at?: string | null;
};

export const outreachStatuses: OutreachStatus[] = [
  "new",
  "queued",
  "replied",
  "skipped",
  "won",
];

export function defaultReplyDraft(target: {
  title: string;
  community?: string | null;
  platform?: OutreachPlatform;
}): string {
  if (target.platform === "twitter") {
    return `If you're looking past Linktree — Cueful is a free link-in-bio with shops + referral codes on one page. Happy to share an example.`;
  }
  const place = target.community ? `r/${target.community}` : "the thread";
  return `Saw this in ${place} — if you want shops + referrals on the same page (not just a link list), Cueful is free and claimable. Happy to share an example page if useful.`;
}
