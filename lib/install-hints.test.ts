import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DISMISS_DAYS,
  GUIDANCE_COPY,
  installGuidance,
  isDismissed,
  normalizeDismissal,
  serializeDismissal,
} from "./install-hints.ts";

const DAY = 86_400_000;
const NOW = 1_780_000_000_000;

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  desktopChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  desktopEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0",
  desktopSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  desktopFirefox:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0",
  ipadOs:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
};

function guide(userAgent: string, hasPrompt = false, maxTouchPoints = 0) {
  return installGuidance({ userAgent, hasPrompt, maxTouchPoints }).kind;
}

describe("isDismissed", () => {
  it("is not dismissed when nothing is stored", () => {
    assert.equal(isDismissed(null, NOW), false);
  });

  it("honours a recent dismissal", () => {
    assert.equal(isDismissed(String(NOW - 3 * DAY), NOW), true);
  });

  it("expires after the window, so it is never permanent again", () => {
    assert.equal(isDismissed(String(NOW - (DISMISS_DAYS + 1) * DAY), NOW), false);
  });

  it("treats the old flag as dismissed rather than as forever", () => {
    // The bug: "1" carried no date and nothing could clear it.
    assert.equal(isDismissed("1", NOW), true);
    assert.equal(normalizeDismissal("1", NOW), String(NOW));
    // Once stamped it ages out like any other.
    assert.equal(isDismissed(normalizeDismissal("1", NOW), NOW + 31 * DAY), false);
  });

  it("ignores junk rather than hiding the panel forever", () => {
    assert.equal(isDismissed("banana", NOW), false);
    assert.equal(isDismissed("", NOW), false);
  });

  it("round-trips what it writes", () => {
    assert.equal(isDismissed(serializeDismissal(NOW), NOW), true);
  });

  it("leaves a normal value alone", () => {
    assert.equal(normalizeDismissal("123", NOW), "123");
    assert.equal(normalizeDismissal(null, NOW), null);
  });
});

describe("installGuidance", () => {
  it("prefers the real prompt whenever the browser offered one", () => {
    assert.equal(guide(UA.desktopChrome, true), "prompt");
    assert.equal(guide(UA.androidChrome, true), "prompt");
  });

  it("gives iOS Safari the Share sheet steps", () => {
    assert.equal(guide(UA.iphoneSafari), "ios-safari");
  });

  it("gives the iOS wrappers their own branch", () => {
    assert.equal(guide(UA.iphoneChrome), "ios-other");
  });

  // iOS 16.4 gave third-party browsers an API for registering real Home Screen
  // web apps, so the old copy -- "only Safari can" -- became false while still
  // reading as authoritative. Pinned so it cannot quietly come back.
  it("does not claim Safari is the only iOS browser that can install", () => {
    const copy = GUIDANCE_COPY["ios-other"];
    assert.ok(!/only safari/i.test(copy), copy);
    assert.match(copy, /Add to Home Screen/);
  });

  it("recognises iPadOS, which reports itself as a Mac", () => {
    assert.equal(guide(UA.ipadOs, false, 5), "ios-safari");
    assert.equal(guide(UA.ipadOs, false, 0), "desktop-safari");
  });

  it("points Android at its browser menu", () => {
    assert.equal(guide(UA.androidChrome), "android-menu");
  });

  it("points desktop Chromium at the address bar, rather than showing nothing", () => {
    assert.equal(guide(UA.desktopChrome), "desktop-chromium");
    assert.equal(guide(UA.desktopEdge), "desktop-chromium");
  });

  it("points desktop Safari at Add to Dock", () => {
    assert.equal(guide(UA.desktopSafari), "desktop-safari");
  });

  it("says so plainly on a browser that cannot install", () => {
    assert.equal(guide(UA.desktopFirefox), "unsupported");
  });

  it("has something true to say for every branch", () => {
    for (const [kind, copy] of Object.entries(GUIDANCE_COPY)) {
      if (kind === "prompt") continue;
      assert.ok(copy.length > 20, kind);
    }
  });
});
