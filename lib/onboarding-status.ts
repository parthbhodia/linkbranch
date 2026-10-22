import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether an account has finished setup.
 *
 * The answer is the profile row for the signed-in user, and it has to be asked
 * for *by id*. `profiles` is world-readable -- the public profile page, the
 * discover grid and the sitemap all read it with the anon key -- so a select
 * with no filter comes back with every published account on the site. Behind
 * `.single()` that is PGRST116 ("The result contains 71 rows"), `data` is null,
 * and "has this person finished setup?" is no for absolutely everyone. That is
 * how signing in -- with a password, with Google, or through the email
 * callback -- sent creators with published pages back to the template picker to
 * build their page a second time.
 *
 * The row is keyed by the auth user id, the same lookup the dashboard and the
 * onboarding page use.
 */

/**
 * Just the one table and column this reads.
 *
 * Narrow on purpose. Typing the client against the project's full generated
 * schema here would make every caller satisfy it, and a structural match
 * against the real query builder ("has a `maybeSingle`") is deep enough that
 * TypeScript gives up with TS2589. A client built with `any` for its schema
 * satisfies this, so the browser and server clients both fit as they are.
 */
type ProfilesForOnboarding = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; onboarding_completed: boolean };
        Insert: { id: string; onboarding_completed?: boolean };
        Update: { onboarding_completed?: boolean };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export async function hasCompletedOnboarding(
  supabase: Pick<SupabaseClient<ProfilesForOnboarding>, "from">,
  userId: string | null | undefined,
): Promise<boolean> {
  // No id means no session (or one that failed to resolve). Nothing to ask for,
  // and a session-less select is exactly the unfiltered read that made this
  // question unanswerable.
  if (!userId) return false;

  const { data } = await supabase
    .from("profiles")
    .select("id,onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  return Boolean(data?.onboarding_completed);
}
