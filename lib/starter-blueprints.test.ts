import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTACT_QUICK_ADDS,
  STARTER_BLUEPRINTS,
  starterBlueprint,
} from "./starter-blueprints.ts";
import { STARTER_PURPOSES } from "./starter-purposes.ts";
import { starterDetailKind } from "./starter-details.ts";

const purposes = Object.keys(STARTER_BLUEPRINTS) as (keyof typeof STARTER_BLUEPRINTS)[];

describe("coverage", () => {
  it("has a blueprint for every purpose the wizard offers, and no extras", () => {
    assert.deepEqual([...purposes].sort(), [...STARTER_PURPOSES].sort());
  });

  it("returns nothing when no purpose was chosen", () => {
    assert.equal(starterBlueprint(null), null);
  });
});

describe("voice", () => {
  it("greets a business as a business and a person as a person", () => {
    const business = ["trades", "local-shop", "whatsapp-business", "business-links"];
    for (const id of purposes) {
      const expected = business.includes(id) ? "This is" : "Hey, I'm";
      assert.equal(STARTER_BLUEPRINTS[id].greeting, expected, id);
    }
  });

  it("gives every purpose its own opening line, never the generic default", () => {
    const headlines = purposes.map((id) => STARTER_BLUEPRINTS[id].headline);
    assert.equal(new Set(headlines).size, headlines.length, "headlines must be distinct");
    for (const id of purposes) {
      assert.ok(STARTER_BLUEPRINTS[id].headlineAccent.length > 2, id);
    }
  });
});

describe("rails", () => {
  it("shows nobody all nineteen buttons", () => {
    for (const id of purposes) {
      const { music, booking, contact } = STARTER_BLUEPRINTS[id].rails;
      assert.ok(!(music.length === 6 && booking && contact), id);
    }
  });

  it("offers music only where music is the point", () => {
    for (const id of purposes) {
      const { music } = STARTER_BLUEPRINTS[id].rails;
      if (id === "musician") assert.equal(music.length, 6);
      else if (id === "creator") assert.deepEqual(music, ["youtube", "spotify"]);
      else assert.deepEqual(music, [], `${id} should not be offered music`);
    }
  });

  it("gives the local businesses the contact rail and desk jobs the booking rail", () => {
    assert.equal(STARTER_BLUEPRINTS["local-shop"].rails.contact, true);
    assert.equal(STARTER_BLUEPRINTS["whatsapp-business"].rails.contact, true);
    assert.equal(STARTER_BLUEPRINTS.trades.rails.contact, true);
    assert.equal(STARTER_BLUEPRINTS.sales.rails.booking, true);
    assert.equal(STARTER_BLUEPRINTS.recruiter.rails.booking, true);
    assert.equal(STARTER_BLUEPRINTS.musician.rails.booking, false);
  });

  it("leaves the deal curator with no rails at all", () => {
    assert.deepEqual(STARTER_BLUEPRINTS.referral.rails, {
      music: [],
      booking: false,
      contact: false,
    });
  });
});

describe("what leads the step", () => {
  it("leads with products exactly where a shop section is offered", () => {
    for (const id of purposes) {
      const leadsWithProducts = STARTER_BLUEPRINTS[id].lead === "products";
      assert.equal(leadsWithProducts, starterDetailKind(id) === "shop", id);
    }
  });

  it("leads the musician with the player", () => {
    assert.equal(STARTER_BLUEPRINTS.musician.lead, "music");
    assert.equal(starterDetailKind("musician"), "music");
  });

  it("renames the step wherever links no longer lead", () => {
    for (const id of purposes) {
      const { lead, stepTitle } = STARTER_BLUEPRINTS[id];
      if (lead === "links") assert.equal(stepTitle, "Add your links", id);
      else assert.notEqual(stepTitle, "Add your links", id);
    }
  });
});

describe("contact quick adds", () => {
  it("only offers destinations the database will accept", () => {
    // links_url_format is ^https?:// -- a tel: link cannot be stored, which is
    // why "Call now" is not on this rail.
    for (const item of CONTACT_QUICK_ADDS) {
      assert.ok(item.url === "" || item.url.startsWith("https://"), item.title);
      assert.ok(!item.url.startsWith("tel:"), item.title);
    }
  });
});
