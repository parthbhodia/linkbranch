import type { FunnelAccount } from "@/lib/funnel";

/**
 * What the creator referral loop is actually producing.
 *
 * The loop has existed since 20260728061422_creator_referral_loop.sql: every
 * published profile carries a badge linking to /?ref=<username>, the client
 * stashes that handle through signup, and claim_profile_referral stamps it onto
 * the new row as referred_by. Nothing reported on it, so whether any of that
 * converts has been an open question rather than a number.
 *
 * The comparison at the end is the point. A count of referred signups says the
 * loop turns, not that it is worth turning -- a channel that delivers people who
 * never finish setup is a cost. Setting the two activation rates side by side is
 * what makes the number decision-shaped.
 */

export type ReferralAccount = Pick<FunnelAccount, "id" | "onboarding_completed"> & {
  /** The profile whose invite led here, or null for everyone who arrived alone. */
  referred_by: string | null;
};

export type ReferralLoopSummary = {
  signups: number;
  /** Accounts that arrived through someone's badge or invite link. */
  referred: number;
  pctReferred: number;
  /**
   * Profiles that produced at least one signup. Compared against how many
   * profiles exist, this is the honest measure of loop participation: a badge
   * on every page means nothing if three people's badges do all the work.
   */
  activeReferrers: number;
  topReferrers: { profileId: string; count: number }[];
  /** Share of referred accounts that finished setup. */
  referredActivationPct: number | null;
  /** The same for everyone else, so the two can be read against each other. */
  organicActivationPct: number | null;
};

function activationPct(accounts: ReferralAccount[]): number | null {
  // Null rather than zero: no accounts in the group means no rate, and a zero
  // here would read as "nobody activated" and invite the wrong conclusion.
  if (accounts.length === 0) return null;
  const finished = accounts.filter((a) => a.onboarding_completed).length;
  return (finished / accounts.length) * 100;
}

export function summariseReferralLoop(
  accounts: ReferralAccount[],
  topLimit = 5,
): ReferralLoopSummary {
  const signups = accounts.length;
  const referred = accounts.filter((a) => a.referred_by !== null);
  const organic = accounts.filter((a) => a.referred_by === null);

  const byReferrer = new Map<string, number>();
  referred.forEach((account) => {
    const referrer = account.referred_by!;
    byReferrer.set(referrer, (byReferrer.get(referrer) ?? 0) + 1);
  });

  return {
    signups,
    referred: referred.length,
    pctReferred: signups === 0 ? 0 : (referred.length / signups) * 100,
    activeReferrers: byReferrer.size,
    topReferrers: [...byReferrer.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topLimit)
      .map(([profileId, count]) => ({ profileId, count })),
    referredActivationPct: activationPct(referred),
    organicActivationPct: activationPct(organic),
  };
}

/**
 * The one-line read on whether the loop is worth investing in, so the card does
 * not just show two percentages and leave the comparison to the reader.
 *
 * Deliberately refuses to call it either way under ten referred accounts. At
 * single digits the difference between the two rates is noise, and a confident
 * caption over three people is how a number starts lying.
 */
export const REFERRAL_VERDICT_MIN = 10;

export function referralVerdict(summary: ReferralLoopSummary): string {
  if (summary.referred === 0) {
    return "No signup has come through the loop yet.";
  }
  if (summary.referred < REFERRAL_VERDICT_MIN) {
    return `Too few referred accounts (${summary.referred}) to compare activation yet.`;
  }

  const referredRate = summary.referredActivationPct ?? 0;
  const organicRate = summary.organicActivationPct ?? 0;
  const gap = referredRate - organicRate;

  if (Math.abs(gap) < 5) {
    return "Referred accounts activate at about the same rate as everyone else.";
  }
  return gap > 0
    ? `Referred accounts activate ${gap.toFixed(0)} points better than the rest.`
    : `Referred accounts activate ${Math.abs(gap).toFixed(0)} points worse than the rest.`;
}
