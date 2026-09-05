import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  directionsUrl,
  parseCoordinateQuery,
  parsePin,
  publicMapLocation,
  roundPin,
} from "./map-location.ts";

describe("parsePin", () => {
  it("accepts numbers", () => {
    assert.deepEqual(parsePin(18.5204, 73.8567), { lat: 18.5204, lng: 73.8567 });
  });

  it("accepts the numeric strings PostgREST returns", () => {
    assert.deepEqual(parsePin("18.5204", "73.8567"), { lat: 18.5204, lng: 73.8567 });
  });

  it("rejects a pin with only one coordinate", () => {
    assert.equal(parsePin(18.5, null), null);
    assert.equal(parsePin(null, 73.8), null);
  });

  it("rejects out-of-range coordinates rather than clamping", () => {
    assert.equal(parsePin(91, 0), null);
    assert.equal(parsePin(0, -181), null);
  });

  it("rejects an empty string rather than reading it as zero", () => {
    assert.equal(parsePin("", ""), null);
  });
});

describe("parseCoordinateQuery", () => {
  it("reads a bare pair", () => {
    assert.deepEqual(parseCoordinateQuery(" 18.5204 , 73.8567 "), {
      lat: 18.5204,
      lng: 73.8567,
    });
  });

  it("reads the @lat,lng,zoom form of a Google Maps URL", () => {
    assert.deepEqual(
      parseCoordinateQuery(
        "https://www.google.com/maps/place/Polar+Star+Tyres/@18.5204,73.8567,17z/data=!3m1",
      ),
      { lat: 18.5204, lng: 73.8567 },
    );
  });

  it("prefers the place pin (!3d!4d) over the viewport when both are present", () => {
    const pin = parseCoordinateQuery(
      "https://www.google.com/maps/place/x/@18.52,73.85,15z/data=!3d18.5211!4d73.8599",
    );
    assert.deepEqual(pin, { lat: 18.5211, lng: 73.8599 });
  });

  it("reads a ?q=lat,lng share link", () => {
    assert.deepEqual(parseCoordinateQuery("https://maps.google.com/?q=18.5204,73.8567"), {
      lat: 18.5204,
      lng: 73.8567,
    });
  });

  it("reads a percent-encoded query", () => {
    assert.deepEqual(parseCoordinateQuery("https://maps.google.com/?q=18.5204%2C73.8567"), {
      lat: 18.5204,
      lng: 73.8567,
    });
  });

  it("returns null for an address, which needs geocoding", () => {
    assert.equal(parseCoordinateQuery("12 Station Road, Pune"), null);
  });

  it("returns null for a Google Maps link with no coordinates in it", () => {
    assert.equal(parseCoordinateQuery("https://maps.app.goo.gl/AbC123"), null);
  });

  it("does not read a house number and postcode as coordinates", () => {
    assert.equal(parseCoordinateQuery("42, 411001"), null);
  });
});

describe("roundPin", () => {
  it("rounds to six decimals", () => {
    assert.deepEqual(roundPin({ lat: 18.52041234567, lng: -73.85671234567 }), {
      lat: 18.520412,
      lng: -73.856712,
    });
  });
});

describe("directionsUrl", () => {
  it("builds the keyless universal Google Maps URL", () => {
    assert.equal(
      directionsUrl({ lat: 18.5204, lng: 73.8567 }),
      "https://www.google.com/maps/dir/?api=1&destination=18.5204,73.8567",
    );
  });
});

describe("publicMapLocation", () => {
  const base = {
    map_lat: "18.5204",
    map_lng: "73.8567",
    map_address: " 12 Station Road ",
    show_map: true,
    display_name: "Polar Star Tyres",
    username: "polar-star",
  };

  it("returns the pin with trimmed address and the display name as label", () => {
    assert.deepEqual(publicMapLocation(base), {
      lat: 18.5204,
      lng: 73.8567,
      address: "12 Station Road",
      label: "Polar Star Tyres",
    });
  });

  it("is null when the map is switched off, even with a pin stored", () => {
    assert.equal(publicMapLocation({ ...base, show_map: false }), null);
  });

  it("is null when there is no pin", () => {
    assert.equal(publicMapLocation({ ...base, map_lat: null, map_lng: null }), null);
  });

  it("falls back to the handle when there is no display name", () => {
    assert.equal(publicMapLocation({ ...base, display_name: "" })?.label, "@polar-star");
  });
});
