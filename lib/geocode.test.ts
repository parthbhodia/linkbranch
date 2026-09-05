import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSearchableQuery, parseNominatimResults } from "./geocode.ts";

describe("parseNominatimResults", () => {
  it("keeps name and coordinates from a jsonv2 payload", () => {
    assert.deepEqual(
      parseNominatimResults([
        { display_name: "Pune, Maharashtra, India", lat: "18.5204", lon: "73.8567", type: "city" },
      ]),
      [{ label: "Pune, Maharashtra, India", lat: 18.5204, lng: 73.8567 }],
    );
  });

  it("drops rows with no name or bad coordinates", () => {
    assert.deepEqual(
      parseNominatimResults([
        { display_name: "", lat: "1", lon: "1" },
        { display_name: "No coords" },
        { display_name: "Out of range", lat: "95", lon: "0" },
        null,
        "string",
      ]),
      [],
    );
  });

  it("caps the list at five", () => {
    const rows = Array.from({ length: 9 }, (_, i) => ({
      display_name: `Place ${i}`,
      lat: "1",
      lon: "1",
    }));
    assert.equal(parseNominatimResults(rows).length, 5);
  });

  it("returns nothing for a non-array payload", () => {
    assert.deepEqual(parseNominatimResults({ error: "Unable to geocode" }), []);
    assert.deepEqual(parseNominatimResults(undefined), []);
  });
});

describe("isSearchableQuery", () => {
  it("rejects very short and very long queries", () => {
    assert.equal(isSearchableQuery("  ab "), false);
    assert.equal(isSearchableQuery("x".repeat(201)), false);
    assert.equal(isSearchableQuery("Pune"), true);
  });
});
