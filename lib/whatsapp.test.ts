import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWhatsAppUrl,
  isWhatsAppUrl,
  normalizeWhatsAppNumber,
  orderMessage,
  parseWhatsAppUrl,
} from "./whatsapp.ts";

describe("normalizeWhatsAppNumber", () => {
  it("strips plus, spaces and dashes", () => {
    assert.equal(normalizeWhatsAppNumber("+91 98765-43210"), "919876543210");
  });

  it("drops leading zeros, which wa.me does not accept", () => {
    assert.equal(normalizeWhatsAppNumber("0091 98765 43210"), "919876543210");
  });

  it("rejects a number that is too short to be international", () => {
    assert.equal(normalizeWhatsAppNumber("98765"), null);
  });

  it("rejects more than fifteen digits", () => {
    assert.equal(normalizeWhatsAppNumber("1234567890123456"), null);
  });

  it("rejects text with no digits", () => {
    assert.equal(normalizeWhatsAppNumber("call me"), null);
  });
});

describe("buildWhatsAppUrl", () => {
  it("encodes the message with %20, not plus", () => {
    assert.equal(
      buildWhatsAppUrl("+91 98765 43210", "Hi! I'd like to order: Best seller"),
      "https://wa.me/919876543210?text=Hi!%20I'd%20like%20to%20order%3A%20Best%20seller",
    );
  });

  it("omits the text parameter when the message is blank", () => {
    assert.equal(buildWhatsAppUrl("919876543210", "   "), "https://wa.me/919876543210");
  });

  it("returns null for an unusable number", () => {
    assert.equal(buildWhatsAppUrl("12", "hello"), null);
  });
});

describe("parseWhatsAppUrl", () => {
  it("reads a wa.me link back into number and message", () => {
    assert.deepEqual(
      parseWhatsAppUrl("https://wa.me/919876543210?text=Hi%20there"),
      { number: "919876543210", message: "Hi there" },
    );
  });

  it("reads the api.whatsapp.com/send form", () => {
    assert.deepEqual(
      parseWhatsAppUrl("https://api.whatsapp.com/send?phone=919876543210&text=Hi"),
      { number: "919876543210", message: "Hi" },
    );
  });

  it("returns an empty message when there is none", () => {
    assert.deepEqual(parseWhatsAppUrl("https://wa.me/919876543210"), {
      number: "919876543210",
      message: "",
    });
  });

  it("rejects a non-WhatsApp host that merely mentions it", () => {
    assert.equal(parseWhatsAppUrl("https://wa.me.example.com/919876543210"), null);
  });

  it("rejects a wa.me link with no number", () => {
    assert.equal(parseWhatsAppUrl("https://wa.me/"), null);
  });

  it("rejects http", () => {
    assert.equal(parseWhatsAppUrl("http://wa.me/919876543210"), null);
  });

  it("rejects garbage", () => {
    assert.equal(parseWhatsAppUrl("not a url"), null);
  });
});

describe("isWhatsAppUrl", () => {
  it("is true for a chat link and false for a shop link", () => {
    assert.equal(isWhatsAppUrl("https://wa.me/919876543210"), true);
    assert.equal(isWhatsAppUrl("https://gumroad.com/l/thing"), false);
  });
});

describe("orderMessage", () => {
  it("names the item", () => {
    assert.equal(orderMessage(" Best seller "), "Hi! I'd like to order: Best seller");
  });

  it("has a generic line when the item has no title yet", () => {
    assert.equal(orderMessage(""), "Hi! I'd like to place an order.");
  });
});
