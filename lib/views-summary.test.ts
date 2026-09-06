import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DIRECT_LABEL, summariseViews, type ViewRow } from "./views-summary.ts";

const NOW = Date.parse("2026-09-06T12:00:00Z");
const DAY = 86_400_000;

function view(partial: Partial<ViewRow> = {}): ViewRow {
  return {
    profile_id: "p1",
    device_type: "mobile",
    country_code: "US",
    referrer: null,
    occurred_at: new Date(NOW - DAY).toISOString(),
    ...partial,
  };
}

describe("summariseViews", () => {
  it("returns zeroes rather than NaN for an empty table", () => {
    const s = summariseViews([], NOW);
    assert.equal(s.total, 0);
    assert.equal(s.human, 0);
    assert.equal(s.botPct, 0);
    assert.equal(s.trendPct, null);
    assert.deepEqual(s.devices, []);
  });

  it("excludes bots from every human figure, matching the funnel's rule", () => {
    const s = summariseViews(
      [view(), view({ device_type: "bot" }), view({ device_type: "bot" })],
      NOW,
    );
    assert.equal(s.total, 3);
    assert.equal(s.human, 1);
    assert.equal(s.bots, 2);
    assert.ok(Math.abs(s.botPct - 66.67) < 0.01);
    // The device breakdown must not contain the bots it just excluded.
    assert.deepEqual(
      s.devices.map((d) => d.label),
      ["mobile"],
    );
  });

  it("labels a missing referrer as direct, which is where QR scans land", () => {
    const s = summariseViews([view({ referrer: null }), view({ referrer: "   " })], NOW);
    assert.equal(s.referrers[0].label, DIRECT_LABEL);
    assert.equal(s.referrers[0].count, 2);
  });

  it("reduces a referrer to its host and drops www", () => {
    const s = summariseViews(
      [
        view({ referrer: "https://www.instagram.com/some/path?x=1" }),
        view({ referrer: "instagram.com" }),
        view({ referrer: "https://t.co/abc" }),
      ],
      NOW,
    );
    const top = s.referrers.find((r) => r.label === "instagram.com");
    assert.equal(top?.count, 2, "bare host and full URL must fold together");
    assert.ok(s.referrers.some((r) => r.label === "t.co"));
  });

  it("does not throw on a malformed referrer", () => {
    const s = summariseViews([view({ referrer: "://" })], NOW);
    assert.equal(s.referrers[0].label, "Unparseable");
  });

  it("splits the last seven days from the seven before it", () => {
    const s = summariseViews(
      [
        view({ occurred_at: new Date(NOW - 2 * DAY).toISOString() }),
        view({ occurred_at: new Date(NOW - 6 * DAY).toISOString() }),
        view({ occurred_at: new Date(NOW - 9 * DAY).toISOString() }),
        // Older than both windows, so it counts toward the total and neither week.
        view({ occurred_at: new Date(NOW - 40 * DAY).toISOString() }),
      ],
      NOW,
    );
    assert.equal(s.last7, 2);
    assert.equal(s.prior7, 1);
    assert.equal(s.human, 4);
    assert.equal(s.trendPct, 100);
  });

  it("reports no trend rather than a division by zero when there is no prior week", () => {
    const s = summariseViews([view()], NOW);
    assert.equal(s.prior7, 0);
    assert.equal(s.trendPct, null);
  });

  it("ignores a timestamp in the future instead of counting it as this week", () => {
    const s = summariseViews([view({ occurred_at: new Date(NOW + DAY).toISOString() })], NOW);
    assert.equal(s.last7, 0);
    assert.equal(s.human, 1);
  });

  it("ranks profiles by views, most seen first", () => {
    const s = summariseViews(
      [
        view({ profile_id: "iggy" }),
        view({ profile_id: "iggy" }),
        view({ profile_id: "iggy" }),
        view({ profile_id: "parth" }),
      ],
      NOW,
    );
    assert.deepEqual(s.topProfiles, [
      { profileId: "iggy", count: 3 },
      { profileId: "parth", count: 1 },
    ]);
  });
});
