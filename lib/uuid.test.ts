import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isUuid } from "./uuid.ts";

describe("isUuid", () => {
  it("accepts a real uuid in either case", () => {
    assert.equal(isUuid("3f2504e0-4f89-11d3-9a0c-0305e82c3301"), true);
    assert.equal(isUuid("3F2504E0-4F89-11D3-9A0C-0305E82C3301"), true);
    // v4, which is what the client actually sends.
    assert.equal(isUuid("9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"), true);
  });

  it("rejects the shapes a bad request actually sends", () => {
    assert.equal(isUuid(""), false);
    assert.equal(isUuid("not-a-uuid"), false);
    // Right length, wrong separators.
    assert.equal(isUuid("3f2504e04f8911d39a0c0305e82c3301"), false);
    // Version 0 and version 6 are outside [1-5].
    assert.equal(isUuid("3f2504e0-4f89-01d3-9a0c-0305e82c3301"), false);
    assert.equal(isUuid("3f2504e0-4f89-61d3-9a0c-0305e82c3301"), false);
    // Variant nibble must be 8, 9, a or b.
    assert.equal(isUuid("3f2504e0-4f89-11d3-7a0c-0305e82c3301"), false);
    // Trailing newline, which an anchored regex must still reject.
    assert.equal(isUuid("3f2504e0-4f89-11d3-9a0c-0305e82c3301\n"), false);
  });

  it("rejects non-strings rather than throwing", () => {
    assert.equal(isUuid(null), false);
    assert.equal(isUuid(undefined), false);
    assert.equal(isUuid(42), false);
    assert.equal(isUuid({}), false);
  });
});
