import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether a public profile is substantial enough to submit to search engines
 * and to list in the public directory.
 *
 * `is_published` cannot carry this on its own. Its default was flipped to true
 * in 20260728113000_default_cueful_badge.sql, so every account is published
 * from the moment the signup trigger creates its row -- before onboarding,
 * before any content. A published page is therefore not evidence that anyone
 * built anything.
 *
 * That left a non-empty bio as the only real gate on the sitemap, which is a
 * low bar for someone registering a free page purely to point a followed link
 * at their own site. Everything published lands in sitemap.xml and is submitted
 * to Google, so the bar for inclusion is the bar for how cheaply the domain can
 * be farmed.
 *
 * The signals below are deliberately ones a real creator clears while setting
 * their page up, and a drive-by registration usually does not.
 */

/** Links needed to qualify when the creator has not uploaded an avatar. */
export const SUBSTANTIVE_MIN_LINKS = 2;

/**
 * A page must exist for this long before it is submitted. Search engines do not
 * crawl within a day of discovery anyway, so this costs a genuine creator
 * nothing measurable, while a page created to be abandoned never reaches it.
 */
export const SUBSTANTIVE_MIN_AGE_HOURS = 24;

const HOUR_IN_MS = 3_600_000;

export type PageQualityInput = {
  bio: string;
  avatarPath: string | null;
  /** profiles.created_at, as returned by PostgREST. */
  createdAt: string;
  activeLinkCount: number;
};

export function isSubstantivePage(
  input: PageQualityInput,
  now: Date = new Date(),
): boolean {
  // Kept from the original sitemap filter: a page with no bio has nothing to
  // rank on and is the clearest sign of an untouched default profile.
  if (input.bio.trim() === "") return false;

  const ageHours = (now.getTime() - new Date(input.createdAt).getTime()) / HOUR_IN_MS;
  // An unparseable timestamp yields NaN, which fails every comparison. Treat it
  // as not-yet-eligible rather than letting it through by accident.
  if (!Number.isFinite(ageHours) || ageHours < SUBSTANTIVE_MIN_AGE_HOURS) {
    return false;
  }

  // Either signal on its own is enough. An avatar is a deliberate upload, and a
  // second link is the point at which a page stops being a redirect to one
  // destination -- so a genuine creator with a single link still qualifies as
  // long as they put a face to it.
  return Boolean(input.avatarPath) || input.activeLinkCount >= SUBSTANTIVE_MIN_LINKS;
}

// PostgREST builds one URL per request, so a few thousand ids in a single
// `in` filter would exceed the server's URL length limit and fail the whole
// query. Chunked, a large site degrades to a few extra round trips instead.
const ID_BATCH_SIZE = 300;

/**
 * Active link counts for the given profiles, keyed by profile id.
 *
 * Readable with the anon key: links_public_read exposes active links belonging
 * to published profiles, which is exactly this set.
 */
export async function countActiveLinks(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (profileIds.length === 0) return counts;

  for (let start = 0; start < profileIds.length; start += ID_BATCH_SIZE) {
    const batch = profileIds.slice(start, start + ID_BATCH_SIZE);
    const { data } = await supabase
      .from("links")
      .select("user_id")
      .eq("is_active", true)
      .in("user_id", batch);

    (data ?? []).forEach((row: { user_id: string }) => {
      counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
    });
  }

  return counts;
}
