import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REFERRAL_VERDICT_MIN,
  referralVerdict,
  summariseReferralLoop,
  type ReferralAccount,
} from "./referral-loop.ts";

function account(partial: Partial<ReferralAccount> = {}): ReferralAccount {
  return {
    id: crypto.randomUUID(),
    onboarding_completed: false,
    referred_by: null,
    ...partial,
  };
}

/** n accounts from one referrer, `finished` of them having completed setup. */
function referredBy(referrer: string, n: number, finished = 0): ReferralAccount[] {
  return Array.from({ length: n }, (_, i) =>
    account({ referred_by: referrer, onboarding_completed: i < finished }),
  );
}

describe("summariseReferralLoop", () => {
  it("returns zeroes rather than NaN before anyone has signed up", () => {
    const s = summariseReferralLoop([]);
    assert.equal(s.signups, 0);
    assert.equal(s.referred, 0);
    assert.equal(s.pctReferred, 0);
    assert.equal(s.activeReferrers, 0);
    assert.deepEqual(s.topReferrers, []);
  });

  it("separates referred accounts from everyone else", () => {
    const s = summariseReferralLoop([
      ...referredBy("iggy", 3),
      account(),
      account(),
    ]);
    assert.equal(s.signups, 5);
    assert.equal(s.referred, 3);
    assert.equal(s.pctReferred, 60);
  });

  it("counts referrers who produced a signup, not profiles that carry a badge", () => {
    // The badge is on every published page; only these two converted anyone.
    const s = summariseReferralLoop([
      ...referredBy("iggy", 4),
      ...referredBy("parth", 1),
      account(),
    ]);
    assert.equal(s.activeReferrers, 2);
    assert.deepEqual(s.topReferrers, [
      { profileId: "iggy", count: 4 },
      { profileId: "parth", count: 1 },
    ]);
  });

  it("caps the top list without losing the count behind it", () => {
    const accounts = ["a", "b", "c", "d", "e", "f"].flatMap((r) => referredBy(r, 1));
    const s = summariseReferralLoop(accounts, 3);
    assert.equal(s.topReferrers.length, 3);
    assert.equal(s.activeReferrers, 6, "the cap is display-only");
  });

  it("reports activation for each group separately", () => {
    const s = summariseReferralLoop([
      ...referredBy("iggy", 4, 3),
      account({ onboarding_completed: true }),
      account(),
      account(),
      account(),
    ]);
    assert.equal(s.referredActivationPct, 75);
    assert.equal(s.organicActivationPct, 25);
  });

  it("reports no rate rather than zero when a group is empty", () => {
    const onlyOrganic = summariseReferralLoop([account(), account()]);
    assert.equal(onlyOrganic.referredActivationPct, null);
    assert.equal(onlyOrganic.organicActivationPct, 0);

    const onlyReferred = summariseReferralLoop(referredBy("iggy", 2));
    assert.equal(onlyReferred.organicActivationPct, null);
  });
});

describe("referralVerdict", () => {
  it("says plainly when the loop has produced nothing", () => {
    const s = summariseReferralLoop([account(), account()]);
    assert.match(referralVerdict(s), /No signup has come through the loop yet/);
  });

  it("refuses to compare on a handful of accounts", () => {
    const s = summariseReferralLoop([
      ...referredBy("iggy", REFERRAL_VERDICT_MIN - 1, 0),
      account({ onboarding_completed: true }),
    ]);
    assert.match(referralVerdict(s), /Too few referred accounts/);
  });

  it("calls a real gap once there are enough to compare", () => {
    const s = summariseReferralLoop([
      ...referredBy("iggy", 10, 9),
      ...Array.from({ length: 10 }, () => account()),
    ]);
    assert.match(referralVerdict(s), /90 points better/);
  });

  it("calls out a loop delivering people who do not activate", () => {
    const s = summariseReferralLoop([
      ...referredBy("iggy", 10, 1),
      ...Array.from({ length: 10 }, (_, i) =>
        account({ onboarding_completed: i < 8 }),
      ),
    ]);
    assert.match(referralVerdict(s), /70 points worse/);
  });

  it("treats a small difference as no difference", () => {
    const s = summariseReferralLoop([
      ...referredBy("iggy", 10, 5),
      ...Array.from({ length: 10 }, (_, i) =>
        account({ onboarding_completed: i < 5 }),
      ),
    ]);
    assert.match(referralVerdict(s), /about the same rate/);
  });
});
