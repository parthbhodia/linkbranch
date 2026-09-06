/**
 * Traffic summary for /admin, computed from raw profile_views rows.
 *
 * The funnel only asks whether a profile has ever been seen. This answers the
 * next question -- how much, from where, on what -- from the same table.
 *
 * The referrer breakdown is the reason this exists. GA4 files a QR scan under
 * "Direct", indistinguishable from someone typing the URL, because a scan
 * carries no referrer. That is the single most important thing to know about a
 * product shared on a card, and only first-party rows can say it.
 */

export type ViewRow = {
  profile_id: string;
  device_type: string | null;
  country_code: string | null;
  referrer: string | null;
  occurred_at: string;
};

export type Breakdown = {
  label: string;
  count: number;
  pct: number;
};

export type ViewsSummary = {
  total: number;
  human: number;
  bots: number;
  botPct: number;
  last7: number;
  prior7: number;
  /** Null when there is no prior week to compare against, not zero. */
  trendPct: number | null;
  devices: Breakdown[];
  referrers: Breakdown[];
  topProfiles: { profileId: string; count: number }[];
};

const DAY = 86_400_000;

/** No referrer means typed, bookmarked, scanned, or sent through an app that
 *  strips it. Worth naming rather than lumping in with real sources. */
export const DIRECT_LABEL = "Direct or scanned";

function referrerLabel(raw: string | null): string {
  const value = (raw ?? "").trim();
  if (!value) return DIRECT_LABEL;

  try {
    // Rows predate any normalising, so a bare host is as likely as a full URL.
    const host = new URL(value.includes("://") ? value : `https://${value}`).hostname;
    return host.replace(/^www\./, "") || DIRECT_LABEL;
  } catch {
    return "Unparseable";
  }
}

function rank(counts: Map<string, number>, total: number, limit: number): Breakdown[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({
      label,
      count,
      pct: total === 0 ? 0 : (count / total) * 100,
    }));
}

export function summariseViews(rows: ViewRow[], now: number = Date.now()): ViewsSummary {
  const total = rows.length;
  // Bots are excluded from every human-facing figure below, the same rule the
  // funnel uses, so the two pages cannot disagree about what a visit is.
  const human = rows.filter((row) => row.device_type !== "bot");
  const bots = total - human.length;

  const devices = new Map<string, number>();
  const referrers = new Map<string, number>();
  const profiles = new Map<string, number>();
  let last7 = 0;
  let prior7 = 0;

  human.forEach((row) => {
    const device = row.device_type ?? "unknown";
    devices.set(device, (devices.get(device) ?? 0) + 1);

    const source = referrerLabel(row.referrer);
    referrers.set(source, (referrers.get(source) ?? 0) + 1);

    profiles.set(row.profile_id, (profiles.get(row.profile_id) ?? 0) + 1);

    const age = now - new Date(row.occurred_at).getTime();
    if (age < 0) return;
    if (age <= 7 * DAY) last7 += 1;
    else if (age <= 14 * DAY) prior7 += 1;
  });

  return {
    total,
    human: human.length,
    bots,
    botPct: total === 0 ? 0 : (bots / total) * 100,
    last7,
    prior7,
    trendPct: prior7 === 0 ? null : ((last7 - prior7) / prior7) * 100,
    devices: rank(devices, human.length, 5),
    referrers: rank(referrers, human.length, 6),
    topProfiles: [...profiles.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([profileId, count]) => ({ profileId, count })),
  };
}
