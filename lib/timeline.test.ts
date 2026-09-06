import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatMonth,
  formatRange,
  isCompleteEntry,
  isMonth,
  rangeError,
  toMonth,
  sortTimeline,
  timelineByKind,
  type TimelineEntry,
} from "./timeline.ts";

function entry(over: Partial<TimelineEntry> = {}): TimelineEntry {
  return {
    id: 1,
    kind: "experience",
    title: "Intern",
    organisation: "Acme",
    location: "",
    started_on: "2024-06",
    ended_on: "2024-09",
    is_current: false,
    description: "",
    ...over,
  };
}

describe("isMonth / formatMonth", () => {
  it("accepts yyyy-mm and nothing else", () => {
    assert.equal(isMonth("2024-06"), true);
    assert.equal(isMonth("2024-13"), false);
    assert.equal(isMonth("2024-00"), false);
    assert.equal(isMonth("2024-6"), false);
    assert.equal(isMonth("2024-06-01"), false);
    assert.equal(isMonth(null), false);
  });

  it("formats a month for people, never showing a day", () => {
    assert.equal(formatMonth("2024-06"), "Jun 2024");
    assert.equal(formatMonth("2023-01"), "Jan 2023");
    assert.equal(formatMonth("2023-12"), "Dec 2023");
    assert.equal(formatMonth("nonsense"), "");
  });
});

describe("toMonth", () => {
  it("reads both the editor format and what the database returns", () => {
    assert.equal(toMonth("2024-06"), "2024-06");
    // PostgREST returns a date column as yyyy-mm-dd; reading only the strict
    // form blanked every range on the public page.
    assert.equal(toMonth("2024-06-01"), "2024-06");
    assert.equal(toMonth("2024-13-01"), null);
    assert.equal(toMonth(null), null);
  });
});

describe("database-format dates", () => {
  const db = (over = {}) =>
    entry({ started_on: "2024-06-01", ended_on: "2024-09-01", ...over });

  it("formats a range that came from the database", () => {
    assert.equal(formatRange(db()), "Jun 2024 — Sep 2024");
  });

  it("sorts entries that came from the database", () => {
    const sorted = sortTimeline([
      db({ id: 1, ended_on: "2024-05-01" }),
      db({ id: 2, ended_on: "2024-09-01" }),
    ]);
    assert.deepEqual(sorted.map((e) => e.id), [2, 1]);
  });

  it("shows a start and Present for a current entry", () => {
    assert.equal(
      formatRange(db({ started_on: "2022-08-01", ended_on: null, is_current: true })),
      "Aug 2022 — Present",
    );
  });
});

describe("formatRange", () => {
  it("shows a finished range", () => {
    assert.equal(formatRange(entry()), "Jun 2024 — Sep 2024");
  });

  it("says Present for a current role, ignoring any end date", () => {
    assert.equal(
      formatRange(entry({ is_current: true, ended_on: "2024-09" })),
      "Jun 2024 — Present",
    );
  });

  it("shows a lone start without a dangling dash", () => {
    assert.equal(formatRange(entry({ ended_on: null })), "Jun 2024");
  });

  it("shows nothing when there are no dates at all", () => {
    assert.equal(formatRange(entry({ started_on: null, ended_on: null })), "");
  });
});

describe("sortTimeline", () => {
  it("puts the most recent first", () => {
    const sorted = sortTimeline([
      entry({ id: 1, ended_on: "2022-06" }),
      entry({ id: 2, ended_on: "2024-06" }),
      entry({ id: 3, ended_on: "2023-06" }),
    ]);
    assert.deepEqual(sorted.map((e) => e.id), [2, 3, 1]);
  });

  it("puts a current role above everything finished, however old its start", () => {
    const sorted = sortTimeline([
      entry({ id: 1, ended_on: "2026-01" }),
      entry({ id: 2, started_on: "2019-01", ended_on: null, is_current: true }),
    ]);
    assert.deepEqual(sorted.map((e) => e.id), [2, 1]);
  });

  it("puts undated entries last rather than dropping them", () => {
    const sorted = sortTimeline([
      entry({ id: 1, started_on: null, ended_on: null }),
      entry({ id: 2, ended_on: "2020-06" }),
    ]);
    assert.deepEqual(sorted.map((e) => e.id), [2, 1]);
  });

  it("does not mutate its input", () => {
    const input = [entry({ id: 1, ended_on: "2020-06" }), entry({ id: 2, ended_on: "2024-06" })];
    sortTimeline(input);
    assert.deepEqual(input.map((e) => e.id), [1, 2]);
  });
});

describe("timelineByKind", () => {
  it("splits and sorts each side independently", () => {
    const { experience, education } = timelineByKind([
      entry({ id: 1, kind: "education", ended_on: "2021-06" }),
      entry({ id: 2, kind: "experience", ended_on: "2024-06" }),
      entry({ id: 3, kind: "education", ended_on: "2025-06" }),
    ]);
    assert.deepEqual(experience.map((e) => e.id), [2]);
    assert.deepEqual(education.map((e) => e.id), [3, 1]);
  });
});

describe("isCompleteEntry", () => {
  it("needs a title and an organisation", () => {
    assert.equal(isCompleteEntry({ title: "Intern", organisation: "Acme" }), true);
    assert.equal(isCompleteEntry({ title: "Intern", organisation: "  " }), false);
    assert.equal(isCompleteEntry({ title: "", organisation: "Acme" }), false);
  });
});

describe("rangeError", () => {
  it("catches an end before a start", () => {
    assert.match(
      rangeError({ started_on: "2024-09", ended_on: "2024-06", is_current: false }) ?? "",
      /before the start/,
    );
  });

  it("is quiet for a valid or incomplete range", () => {
    assert.equal(rangeError({ started_on: "2024-01", ended_on: "2024-09", is_current: false }), null);
    assert.equal(rangeError({ started_on: "2024-01", ended_on: null, is_current: false }), null);
    assert.equal(rangeError({ started_on: null, ended_on: "2024-09", is_current: false }), null);
  });

  it("does not complain about a stale end date on a current role", () => {
    assert.equal(rangeError({ started_on: "2024-09", ended_on: "2024-06", is_current: true }), null);
  });
});
