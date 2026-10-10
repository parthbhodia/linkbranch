/**
 * Where to send someone the moment they have a session.
 *
 * This existed in three places and disagreed in two of them. The password path
 * in components/auth-form.tsx looked up onboarding_completed and sent finished
 * accounts to the dashboard; the Google path handed the callback a `next`
 * computed at render time -- before anyone was signed in, so always
 * "/templates" for a plain sign-in -- and app/auth/callback/route.ts forwarded
 * it without ever asking whether the account had finished setup. The result was
 * that signing in with Google showed the template picker every single time, to
 * people who had picked a template months ago.
 *
 * So the rule lives here, once, and is the same rule whichever way the session
 * arrived: an explicit destination wins, and otherwise a finished account goes
 * to its dashboard.
 */

export const TEMPLATE_PICKER = "/templates";
export const DASHBOARD = "/dashboard";

/**
 * Whether a `next` value is a path on this site rather than somewhere else.
 *
 * Open-redirect guard: `next` arrives in a URL anyone can write, and it is
 * followed after authentication, which is exactly when a redirect to an
 * attacker's copy of the sign-in page is worth the most. Backslashes are
 * rejected alongside "//" because some browsers normalise "/\" to "//" and
 * would leave the origin.
 */
export function isInternalPath(value: string | null | undefined): value is string {
  if (typeof value !== "string" || value === "") return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;
  return true;
}

export function postAuthDestination({
  requested,
  onboardingCompleted,
}: {
  /** The `next` the flow asked for, if any. */
  requested?: string | null;
  onboardingCompleted: boolean;
}): string {
  const safe = isInternalPath(requested) ? requested : null;

  // A flow that named somewhere specific -- claiming a draft, an import, a
  // starter purpose -- has already decided, and knows something this function
  // does not. The template picker is the one exception: it is the default
  // nobody chose, so it is the only value worth second-guessing.
  if (safe && safe !== TEMPLATE_PICKER) return safe;

  return onboardingCompleted ? DASHBOARD : TEMPLATE_PICKER;
}
