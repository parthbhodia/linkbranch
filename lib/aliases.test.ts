import assert from "node:assert/strict";
import { test } from "node:test";

import {
  aliasErrorMessage,
  aliasFormatError,
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
