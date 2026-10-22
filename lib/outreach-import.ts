import {
  defaultReplyDraft,
  type OutreachImportItem,
  type OutreachPlatform,
} from "@/lib/outreach";

type RedditScanItem = {
  id: string;
  title: string;
  subreddit?: string;
  score?: number;
  comments?: number;
  author?: string;
  url: string;
  selftext?: string;
  age_days?: number | null;
  archived?: boolean;
  query?: string;
  target_score?: number;
};

type TwitterScanItem = {
  id: string;
  author?: string;
  text?: string;
  created_at?: string;
  likes?: number;
  views?: string | number;
  url?: string;
  query?: string;
};

function scoreTwitter(item: TwitterScanItem): number {
  const text = (item.text || "").toLowerCase();
  let s = 20;
  if (
    /alternative|replace|instead of|hate|expensive|pricing|outdated|better than/.test(
      text,
    )
  ) {
    s += 35;
  }
  if (/\?/.test(item.text || "")) s += 15;
  if (/linktree|link in bio|beacons|carrd|stan\.store/.test(text)) s += 15;
  if (/i built|i made|just launched|meet \w+|try https/.test(text)) s -= 20;
  const likes = item.likes ?? 0;
  if (likes >= 5 && likes <= 500) s += 10;
  return Math.max(0, s);
}

export function fromRedditScan(items: RedditScanItem[]): OutreachImportItem[] {
  return items
    .filter((item) => item.id && item.url && item.title)
    .filter((item) => !item.archived)
    .map((item) => ({
      platform: "reddit" as const,
      external_id: item.id,
      title: item.title.slice(0, 400),
      url: item.url.startsWith("http")
        ? item.url
        : `https://reddit.com${item.url}`,
      author: item.author ?? null,
      community: item.subreddit ?? null,
      body: (item.selftext ?? "").slice(0, 8000),
      score: item.score ?? 0,
      comments: item.comments ?? 0,
      target_score: item.target_score ?? 0,
      query: item.query ?? null,
      posted_at:
        item.age_days != null
          ? new Date(Date.now() - item.age_days * 86400000).toISOString()
          : null,
    }));
}

export function fromTwitterScan(
  items: TwitterScanItem[],
  query?: string,
): OutreachImportItem[] {
  return items
    .filter((item) => item.id && (item.text || item.url))
    .map((item) => {
      const text = (item.text ?? "").trim();
      const title = text.slice(0, 120) || `Tweet ${item.id}`;
      const url =
        item.url ||
        (item.author
          ? `https://x.com/${item.author}/status/${item.id}`
          : `https://x.com/i/status/${item.id}`);
      return {
        platform: "twitter" as const,
        external_id: String(item.id),
        title,
        url,
        author: item.author ?? null,
        community: null,
        body: text.slice(0, 8000),
        score: item.likes ?? 0,
        comments: 0,
        target_score: scoreTwitter({ ...item, query }),
        query: query ?? item.query ?? null,
        posted_at: item.created_at
          ? new Date(item.created_at).toISOString()
          : null,
      };
    });
}

export function withReplyDrafts(items: OutreachImportItem[]) {
  return items.map((item) => ({
    ...item,
    reply_draft: defaultReplyDraft({
      title: item.title,
      community: item.community,
      platform: item.platform,
    }),
  }));
}

export function normalizePlatform(
  value: unknown,
): OutreachPlatform | undefined {
  if (
    value === "reddit" ||
    value === "twitter" ||
    value === "web" ||
    value === "other"
  ) {
    return value;
  }
  return undefined;
}
