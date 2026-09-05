import { isSubstantivePage } from "@/lib/page-quality";

/**
 * The activation funnel, computed from raw rows.
 *
 * Mirrors supabase/analytics/funnel.sql query 1 -- same stages, same order,
 * same cumulative rule -- so the page and the SQL cannot drift into telling
 * different stories.
 *
 * Cumulative means reaching a stage requires having cleared every stage above
 * it. Counting each milestone independently produces a chart where a later
 * stage can exceed an earlier one (finishing setup without ever adding a link
 * does exactly that), which looks like a funnel while making it impossible to
 * say where anyone actually stopped.
 *
 * Note what is deliberately absent: is_published. Its default is true and the
 * signup trigger creates the row, so it is true for everyone from the moment
 * they register and would sit at 100% telling you nothing.
 */

export type FunnelAccount = {
  id: string;
  created_at: string;
  bio: string;
  avatar_path: string | null;
  onboarding_completed: boolean;
};

export type FunnelStage = {
  label: string;
  /** What the person did, for the caption under each row. */
  detail: string;
  people: number;
  pctOfSignups: number;
  lostHere: number;
  pctLostHere: number | null;
};

export type FunnelInput = {
  accounts: FunnelAccount[];
  activeLinkCounts: Map<string, number>;
  humanViewCounts: Map<string, number>;
  clickCounts: Map<string, number>;
  now?: Date;
};

export function buildActivationFunnel({
  accounts,
  activeLinkCounts,
  humanViewCounts,
  clickCounts,
  now = new Date(),
}: FunnelInput): FunnelStage[] {
  const predicates: { label: string; detail: string; test: (a: FunnelAccount) => boolean }[] = [
    {
      label: "Signed up",
      detail: "Account created",
      test: () => true,
    },
    {
      label: "Personalised the page",
      detail: "Wrote a bio or uploaded an avatar",
      test: (a) => a.bio.trim() !== "" || Boolean(a.avatar_path),
    },
    {
      label: "Added a link",
      detail: "At least one active link",
      test: (a) => (activeLinkCounts.get(a.id) ?? 0) >= 1,
    },
    {
      label: "Finished setup",
      detail: "Completed onboarding",
      test: (a) => a.onboarding_completed,
    },
    {
      label: "Page is indexable",
      detail: "Clears the sitemap bar",
      test: (a) =>
        isSubstantivePage(
          {
            bio: a.bio,
            avatarPath: a.avatar_path,
            createdAt: a.created_at,
            activeLinkCount: activeLinkCounts.get(a.id) ?? 0,
          },
          now,
        ),
    },
    {
      label: "Got a visitor",
      detail: "At least one non-bot view",
      test: (a) => (humanViewCounts.get(a.id) ?? 0) > 0,
    },
    {
      label: "Got a click",
      detail: "Someone opened one of their links",
      test: (a) => (clickCounts.get(a.id) ?? 0) > 0,
    },
  ];

  const signups = accounts.length;
  const stages: FunnelStage[] = [];
  // Narrowed at each step, which is what makes the result cumulative.
  let survivors = accounts;
  let previous = signups;

  predicates.forEach((predicate, index) => {
    survivors = index === 0 ? survivors : survivors.filter(predicate.test);
    const people = survivors.length;
    stages.push({
      label: predicate.label,
      detail: predicate.detail,
      people,
      pctOfSignups: signups === 0 ? 0 : (people / signups) * 100,
      lostHere: index === 0 ? 0 : previous - people,
      pctLostHere:
        index === 0 || previous === 0 ? null : ((previous - people) / previous) * 100,
    });
    previous = people;
  });

  return stages;
}

/**
 * The stage with the largest proportional loss, which is the one worth fixing
 * first. Absolute loss would always point at whichever step happens to sit
 * behind the biggest cohort rather than at the worst step.
 */
export function worstStage(stages: FunnelStage[]): FunnelStage | null {
  const candidates = stages.filter((stage) => stage.pctLostHere !== null && stage.people >= 0);
  if (candidates.length === 0) return null;

  return candidates.reduce((worst, stage) =>
    (stage.pctLostHere ?? 0) > (worst.pctLostHere ?? 0) ? stage : worst,
  );
}
