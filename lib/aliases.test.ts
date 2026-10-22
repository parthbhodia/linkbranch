import assert from "node:assert/strict";
import { test } from "node:test";

import {
  aliasErrorMessage,
  aliasFormatError,
  aliasSuggestions,
  normaliseAlias,
} from "./aliases.ts";

test("normalises the way the database does", () => {
  assert.equal(normaliseAlias("  MK-TV  "), "mk-tv");
  assert.equal(normaliseAlias("mk tv"), "mktv");
});

test("accepts the names people actually have", () => {
  assert.equal(aliasFormatError("mktv"), null);
  assert.equal(aliasFormatError("mk-tv"), null);
  assert.equal(aliasFormatError("mk_tv_2"), null);
  assert.equal(aliasFormatError("MKTV"), null);
});

test("rejects names the handle format would reject", () => {
  assert.match(aliasFormatError("ab") ?? "", /at least 3/);
  assert.match(aliasFormatError("a".repeat(31)) ?? "", /at most 30/);
  assert.match(aliasFormatError("-mktv") ?? "", /letters, numbers/);
  assert.match(aliasFormatError("mk.tv") ?? "", /letters, numbers/);
  assert.match(aliasFormatError("mk/tv") ?? "", /letters, numbers/);
});

test("asks for something rather than reporting a format problem", () => {
  assert.equal(aliasFormatError(""), "Enter a name.");
  assert.equal(aliasFormatError("   "), "Enter a name.");
});

test("a missing migration reads as setup, not as the user's mistake", () => {
  const missingFunction =
    'Could not find the function public.add_profile_alias(candidate) in the schema cache';
  assert.match(aliasErrorMessage(missingFunction), /database update/);
  assert.match(
    aliasErrorMessage("mktv is already taken"),
    /^mktv is already taken$/,
  );
});

test("suggests the brand spelling the handle cannot be", () => {
  // The case that started this: MKTV against the handle mk-tv.
  assert.deepEqual(aliasSuggestions({ displayName: "MKTV", username: "mk-tv" }), [
    "mktv",
  ]);
});

test("offers the full name and its first word", () => {
  assert.deepEqual(
    aliasSuggestions({ displayName: "Parth Bhodia", username: "parth-bhodia" }),
    ["parthbhodia", "parth"],
  );
});

test("folds accents rather than dropping the letter they sit on", () => {
  assert.deepEqual(
    aliasSuggestions({ displayName: "José Álvarez", username: "jose" }),
    ["josealvarez"],
  );
});

test("never suggests a name the profile already answers to", () => {
  assert.deepEqual(
    aliasSuggestions({
      displayName: "MKTV",
      username: "mk-tv",
      taken: ["mktv"],
    }),
    [],
  );
  // The handle itself is skipped too, so "mktv" is not offered as its own alias.
  assert.deepEqual(
    aliasSuggestions({ displayName: "mktv", username: "mktv" }),
    [],
  );
});

test("suggestions are always names the database would accept", () => {
  // "MK" on its own is too short to offer, but the handle without its dash is
  // not -- so the short display name costs nothing.
  assert.deepEqual(aliasSuggestions({ displayName: "MK", username: "mk-tv" }), [
    "mktv",
  ]);
  for (const suggestion of aliasSuggestions({
    displayName: "Parth Bhodia",
    username: "parth-bhodia",
  })) {
    assert.equal(aliasFormatError(suggestion), null);
  }
});
