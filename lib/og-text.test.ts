import assert from "node:assert/strict";
import { test } from "node:test";

import { drawableCardText } from "./og-text.ts";

test("keeps plain Latin copy unchanged", () => {
  assert.equal(
    drawableCardText("I make useful things for the web."),
    "I make useful things for the web.",
  );
});

test("keeps accented Latin letters", () => {
  assert.equal(drawableCardText("Café · Zürich"), "Café · Zürich");
});

test("drops a script the card font cannot shape", () => {
  assert.equal(
    drawableCardText("اختر التطبيق المتوافق مع نوع جهازك واضغط للتحميل مباشرة."),
    "",
  );
});

test("keeps the Latin remnant of mixed copy", () => {
  assert.equal(drawableCardText("MKTV — اختر التطبيق"), "MKTV —");
});

test("punctuation-only leftovers collapse to empty", () => {
  assert.equal(drawableCardText("...،"), "");
  assert.equal(drawableCardText("—"), "");
});

test("collapses whitespace left by stripping", () => {
  assert.equal(drawableCardText("MKTV     اختر     TV"), "MKTV TV");
});

test("handles null, undefined and blank", () => {
  assert.equal(drawableCardText(null), "");
  assert.equal(drawableCardText(undefined), "");
  assert.equal(drawableCardText("   "), "");
});
