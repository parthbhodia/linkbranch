import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasCompletedOnboarding } from "./onboarding-status.ts";

/**
 * Stands in for a Supabase client, and records the query so the test can check
 * what was asked for -- the bug this fixes was a missing filter, which a
 * "returns the right boolean" assertion alone would not catch.
 */
type Client = Parameters<typeof hasCompletedOnboarding>[0];

function reader(row: { onboarding_completed: boolean } | null) {
  const calls: string[] = [];
  const client = {
    from(table: string) {
      calls.push(`from:${table}`);
      return {
        select(columns: string) {
          calls.push(`select:${columns}`);
          return {
            eq(column: string, value: string) {
              calls.push(`eq:${column}=${value}`);
              return {
                maybeSingle: async () => ({ data: row }),
              };
            },
          };
        },
      };
    },
  };
  // Only `from` is used, and only the three chained calls every response is
  // built from; the real client carries a lot more than this test needs.
  return { client: client as unknown as Client, calls };
}

describe("hasCompletedOnboarding", () => {
  it("says yes for an account whose row is flagged", async () => {
    const { client } = reader({ onboarding_completed: true });
    assert.equal(await hasCompletedOnboarding(client, "user-1"), true);
  });

  it("says no for a row that has not been through setup", async () => {
    const { client } = reader({ onboarding_completed: false });
    assert.equal(await hasCompletedOnboarding(client, "user-1"), false);
  });

  it("says no when the account has no profile row at all", async () => {
    const { client } = reader(null);
    assert.equal(await hasCompletedOnboarding(client, "user-1"), false);
  });

  it("scopes the read to the signed-in user", async () => {
    // Without the filter this returned every published profile; `.single()`
    // then failed with PGRST116 and everyone was treated as unfinished.
    const { client, calls } = reader({ onboarding_completed: true });
    await hasCompletedOnboarding(client, "user-1");
    assert.deepEqual(calls, [
      "from:profiles",
      "select:id,onboarding_completed",
      "eq:id=user-1",
    ]);
  });

  it("does not query without a user id", async () => {
    const { client, calls } = reader({ onboarding_completed: true });
    assert.equal(await hasCompletedOnboarding(client, null), false);
    assert.equal(await hasCompletedOnboarding(client, undefined), false);
    assert.equal(await hasCompletedOnboarding(client, ""), false);
    assert.deepEqual(calls, []);
  });
});
