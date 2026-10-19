import assert from "node:assert/strict";
import test from "node:test";
import {
  contrastRatio,
  parseRgb,
  relativeLuminance,
  requiredVeil,
} from "./avatar-scrim.ts";

test("luminance matches the ends of the range", () => {
  assert.equal(relativeLuminance(255, 255, 255), 1);
  assert.equal(relativeLuminance(0, 0, 0), 0);
});

test("luminance weights green most and blue least", () => {
  const green = relativeLuminance(0, 255, 0);
  const blue = relativeLuminance(0, 0, 255);
  assert.ok(green > blue, "green should read brighter than blue");
});

test("luminance clamps out-of-range channels instead of producing nonsense", () => {
  assert.equal(relativeLuminance(300, 300, 300), 1);
  assert.equal(relativeLuminance(-40, -40, -40), 0);
});

test("contrast ratio is symmetric and never below one", () => {
  assert.equal(contrastRatio(1, 0), contrastRatio(0, 1));
  assert.ok(contrastRatio(0.5, 0.9) >= 1);
});

test("contrast ratio of black on white is the WCAG maximum", () => {
  assert.equal(Math.round(contrastRatio(1, 0) * 100) / 100, 21);
});

test("a photograph that already carries the text is left completely alone", () => {
  // Bright photo, dark text: no veil at all.
  assert.equal(requiredVeil(0.8, 0.05, 0.9), 0);
  // Dark photo, light text: likewise.
  assert.equal(requiredVeil(0.02, 0.95, 0.01), 0);
});

test("a photograph at the edge of legibility needs only a token veil", () => {
  // Mid-grey photo under dark text -- contrast is about 3.4:1, short of 4.5.
  const veil = requiredVeil(0.18, 0.02, 0.9);
  assert.ok(veil > 0 && veil < 0.3, `expected a small veil, got ${veil}`);
});

test("the veil found is actually enough, and one step less is not", () => {
  // A photo too bright for dark text, on a light card whose surface does carry
  // that text. This is the case the fixed scrim existed for: the photo has to be
  // pulled down toward the card, and the veil found should be the least that
  // does it rather than a round number.
  const photo = 0.3;
  const text = 0.05;
  const surface = 0.9;
  const veil = requiredVeil(photo, text, surface);
  assert.ok(veil > 0, "this photo does need a veil");
  const mixed = photo * (1 - veil) + surface * veil;
  const justUnder = photo * (1 - (veil - 0.01)) + surface * (veil - 0.01);
  assert.ok(contrastRatio(mixed, text) >= 4.5, "the veil should reach the target");
  assert.ok(
    contrastRatio(justUnder, text) < 4.5,
    "a smaller veil should not have been enough",
  );
});

test("a veil of one is returned when the surface cannot carry the text either", () => {
  // Mid-grey text on a mid-grey surface: nothing to veil toward.
  assert.equal(requiredVeil(0.02, 0.2, 0.21), 1);
});

test("the veil never leaves the zero-to-one range", () => {
  for (const photo of [0, 0.25, 0.5, 0.75, 1]) {
    for (const text of [0, 0.5, 1]) {
      for (const surface of [0, 0.5, 1]) {
        const veil = requiredVeil(photo, text, surface);
        assert.ok(veil >= 0 && veil <= 1, `veil ${veil} out of range`);
      }
    }
  }
});

test("a stricter target never asks for less veil than a looser one", () => {
  const loose = requiredVeil(0.05, 0.95, 0.9, 3);
  const strict = requiredVeil(0.05, 0.95, 0.9, 7);
  assert.ok(strict >= loose, "stricter should need at least as much");
});

test("colours parse from every shape a stylesheet or canvas returns", () => {
  assert.deepEqual(parseRgb("#fff"), { r: 255, g: 255, b: 255 });
  assert.deepEqual(parseRgb("#1B1E18"), { r: 27, g: 30, b: 24 });
  assert.deepEqual(parseRgb("rgb(27, 30, 24)"), { r: 27, g: 30, b: 24 });
  assert.deepEqual(parseRgb("27, 30, 24"), { r: 27, g: 30, b: 24 });
});

test("unparseable colours return null instead of a guess", () => {
  assert.equal(parseRgb(""), null);
  assert.equal(parseRgb("chartreuse"), null);
  assert.equal(parseRgb("#12"), null);
  assert.equal(parseRgb("#gggggg"), null);
});
