import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COMMON_CURRENCIES,
  guessCurrency,
  isCurrencyCode,
} from "./currency-guess.ts";

describe("guessCurrency", () => {
  it("reads the region from a full locale", () => {
    assert.equal(guessCurrency("en-IN"), "INR");
    assert.equal(guessCurrency("en-GB"), "GBP");
    assert.equal(guessCurrency("de-DE"), "EUR");
  });

  it("accepts an underscore separator", () => {
    assert.equal(guessCurrency("en_AU"), "AUD");
  });

  it("expands a bare language to its likely region", () => {
    assert.equal(guessCurrency("hi"), "INR");
    assert.equal(guessCurrency("ja"), "JPY");
  });

  it("falls back to USD for an unknown region", () => {
    assert.equal(guessCurrency("en-AQ"), "USD");
  });

  it("falls back to USD when there is no locale", () => {
    assert.equal(guessCurrency(undefined), "USD");
    assert.equal(guessCurrency(""), "USD");
  });

  it("falls back rather than throwing on junk", () => {
    assert.equal(guessCurrency("!!"), "USD");
  });
});

describe("COMMON_CURRENCIES", () => {
  it("leads with the four most common and has no duplicates", () => {
    assert.deepEqual(COMMON_CURRENCIES.slice(0, 4), ["USD", "INR", "EUR", "GBP"]);
    assert.equal(new Set(COMMON_CURRENCIES).size, COMMON_CURRENCIES.length);
  });

  it("only contains codes the database check accepts", () => {
    assert.ok(COMMON_CURRENCIES.every(isCurrencyCode));
  });
});
