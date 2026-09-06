import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SHARE_SOURCES,
  SHARE_SOURCE_LABELS,
  isScanSource,
  isShareSource,
  parseShareSource,
  withShareSource,
  withoutShareSource,
} from "./share-source.ts";

describe("parseShareSource", () => {
  it("accepts every known source", () => {
    for (const source of SHARE_SOURCES) {
      assert.equal(parseShareSource(source), source);
    }
  });

  it("trims and lowercases", () => {
    assert.equal(parseShareSource("  QR "), "qr");
  });

  it("rejects anything unknown, so a stranger cannot write arbitrary values", () => {
    assert.equal(parseShareSource("instagram"), null);
    assert.equal(parseShareSource("'; drop table --"), null);
    assert.equal(parseShareSource(""), null);
    assert.equal(parseShareSource(null), null);
    assert.equal(parseShareSource(42), null);
  });
});

describe("withShareSource", () => {
  it("adds the tag", () => {
    assert.equal(
      withShareSource("https://cueful.bio/avery", "qr"),
      "https://cueful.bio/avery?s=qr",
    );
  });

  it("replaces an existing tag rather than adding a second", () => {
    assert.equal(
      withShareSource("https://cueful.bio/avery?s=poster", "tent"),
      "https://cueful.bio/avery?s=tent",
    );
  });

  it("keeps other parameters", () => {
    assert.equal(
      withShareSource("https://cueful.bio/avery?published=1", "wallet"),
      "https://cueful.bio/avery?published=1&s=wallet",
    );
  });

  it("returns unparseable input untouched", () => {
    assert.equal(withShareSource("not a url", "qr"), "not a url");
  });
});

describe("withoutShareSource", () => {
  it("removes the tag and leaves no dangling question mark", () => {
    assert.equal(
      withoutShareSource("https://cueful.bio/avery?s=qr"),
      "https://cueful.bio/avery",
    );
  });

  it("keeps the other parameters", () => {
    assert.equal(
      withoutShareSource("https://cueful.bio/avery?s=qr&published=1"),
      "https://cueful.bio/avery?published=1",
    );
  });

  it("is a no-op on an untagged URL", () => {
    assert.equal(
      withoutShareSource("https://cueful.bio/avery"),
      "https://cueful.bio/avery",
    );
  });
});

describe("isScanSource", () => {
  it("counts the physical surfaces as scans", () => {
    assert.equal(isScanSource("qr"), true);
    assert.equal(isScanSource("wallet"), true);
    assert.equal(isScanSource("tent"), true);
  });

  it("does not count a tapped link as a scan", () => {
    assert.equal(isScanSource("square"), false);
    assert.equal(isScanSource("signature"), false);
    assert.equal(isScanSource(null), false);
  });
});

describe("labels", () => {
  it("names every source", () => {
    for (const source of SHARE_SOURCES) {
      assert.ok(SHARE_SOURCE_LABELS[source]);
    }
    assert.equal(isShareSource("qr"), true);
  });
});
