import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STARTER_PURPOSES,
  parseStarterPurpose,
} from "./starter-purposes.ts";

describe("parseStarterPurpose", () => {
  it("accepts every purpose the wizard offers", () => {
    for (const purpose of STARTER_PURPOSES) {
      assert.equal(parseStarterPurpose(purpose), purpose);
    }
  });

  it("accepts a hyphenated id, which a looser check could mangle", () => {
    assert.equal(parseStarterPurpose("local-shop"), "local-shop");
    assert.equal(parseStarterPurpose("whatsapp-business"), "whatsapp-business");
  });

  it("trims surrounding whitespace a copied link can carry", () => {
    assert.equal(parseStarterPurpose("  student  "), "student");
  });

  it("rejects anything not on the list rather than passing it through", () => {
    assert.equal(parseStarterPurpose("hacker"), null);
    assert.equal(parseStarterPurpose("Student"), null, "matching is exact, not case-folded");
    assert.equal(parseStarterPurpose(""), null);
    assert.equal(parseStarterPurpose("   "), null);
  });

  it("rejects absent values rather than throwing on them", () => {
    assert.equal(parseStarterPurpose(null), null);
    assert.equal(parseStarterPurpose(undefined), null);
  });

  it("is not fooled by inherited Object properties", () => {
    assert.equal(parseStarterPurpose("toString"), null);
    assert.equal(parseStarterPurpose("constructor"), null);
  });
});
