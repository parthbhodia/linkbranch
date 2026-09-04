import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { adminAllowlistCount, isAdminEmail } from "./admin-access.ts";

// The allowlist is the only thing standing between a signed-in stranger and
// every account's numbers, so the interesting cases are the ways a near-miss
// could be accepted.

const original = process.env.ADMIN_EMAILS;

function withAllowlist(value: string | undefined) {
  if (value === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = value;
}

afterEach(() => withAllowlist(original));

describe("isAdminEmail", () => {
  it("admits nobody when ADMIN_EMAILS is unset", () => {
    withAllowlist(undefined);
    assert.equal(isAdminEmail("owner@example.com"), false);
  });

  it("admits nobody when ADMIN_EMAILS is empty", () => {
    withAllowlist("");
    assert.equal(isAdminEmail("owner@example.com"), false);
  });

  it("admits nobody when ADMIN_EMAILS is only separators", () => {
    withAllowlist(" , ,, ");
    assert.equal(isAdminEmail("owner@example.com"), false);
  });

  it("accepts an exact match", () => {
    withAllowlist("owner@example.com");
    assert.equal(isAdminEmail("owner@example.com"), true);
  });

  it("ignores case on both sides", () => {
    withAllowlist("Owner@Example.COM");
    assert.equal(isAdminEmail("OWNER@example.com"), true);
  });

  it("ignores whitespace around a configured address", () => {
    withAllowlist("  owner@example.com  ,  second@example.com  ");
    assert.equal(isAdminEmail("second@example.com"), true);
  });

  it("ignores whitespace around the supplied address", () => {
    withAllowlist("owner@example.com");
    assert.equal(isAdminEmail("  owner@example.com  "), true);
  });

  it("matches an entry other than the first", () => {
    withAllowlist("a@example.com,b@example.com,c@example.com");
    assert.equal(isAdminEmail("c@example.com"), true);
  });

  it("rejects an address that merely starts with a configured one", () => {
    withAllowlist("owner@gmail.com");
    assert.equal(isAdminEmail("owner@gmail.com.evil.com"), false);
  });

  it("rejects an address that merely ends with a configured one", () => {
    withAllowlist("owner@gmail.com");
    assert.equal(isAdminEmail("not-the-owner@gmail.com"), false);
  });

  it("rejects a substring of a configured address", () => {
    withAllowlist("owner@gmail.com");
    assert.equal(isAdminEmail("owner@gmail.co"), false);
  });

  it("rejects null", () => {
    withAllowlist("owner@example.com");
    assert.equal(isAdminEmail(null), false);
  });

  it("rejects undefined", () => {
    withAllowlist("owner@example.com");
    assert.equal(isAdminEmail(undefined), false);
  });

  it("rejects an empty address even with a configured allowlist", () => {
    withAllowlist("owner@example.com");
    assert.equal(isAdminEmail(""), false);
  });
});

describe("adminAllowlistCount", () => {
  it("is zero when unset", () => {
    withAllowlist(undefined);
    assert.equal(adminAllowlistCount(), 0);
  });

  it("ignores empty entries", () => {
    withAllowlist("a@example.com,,b@example.com, ");
    assert.equal(adminAllowlistCount(), 2);
  });
});
