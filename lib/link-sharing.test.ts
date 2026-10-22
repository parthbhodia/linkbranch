import assert from "node:assert/strict";
import { test } from "node:test";

import {
  linkShareTargets,
  shareMessage,
  shortenShareUrl,
} from "./link-sharing.ts";

const url = "https://gofund.me/4f1f6a2b";
const targets = linkShareTargets({ url, title: "Support osama's family" });

test("carries the link to every destination", () => {
  for (const target of targets) {
    assert.ok(
      target.href.includes(encodeURIComponent(url)),
      `${target.id} lost the url`,
    );
    assert.match(target.href, /^(https:\/\/|mailto:)/);
  }
});

test("characters that would split the query are escaped", () => {
  // An unescaped & ends the parameter and a # truncates it, so these are the
  // ones that matter. An apostrophe is a legal query character and is left as
  // it is, which is why it is not asserted on here.
  const awkward = linkShareTargets({ url, title: "Tom & Jerry #1" });
  const whatsapp = awkward.find((item) => item.id === "whatsapp");
  assert.ok(whatsapp?.href.includes(encodeURIComponent("Tom & Jerry #1")));
  for (const target of awkward) {
    assert.ok(!target.href.includes("Tom &"), `${target.id} left a raw &`);
    assert.ok(!target.href.includes(" #1"), `${target.id} left a raw #`);
  }
});

test("names the page being shared, not just the address", () => {
  const whatsapp = targets.find((item) => item.id === "whatsapp");
  assert.ok(
    whatsapp?.href.includes(encodeURIComponent("Support osama's family — ")),
  );
});

test("a link with no title still shares cleanly", () => {
  // A shared message should not open with a separator.
  assert.equal(shareMessage("", url), url);
  assert.equal(shareMessage("   ", url), url);

  const untitled = linkShareTargets({ url, title: "" });
  const whatsapp = untitled.find((item) => item.id === "whatsapp");
  assert.ok(whatsapp?.href.endsWith(encodeURIComponent(url)));
  // Email falls back to the url when there is no subject to use.
  const email = untitled.find((item) => item.id === "email");
  assert.ok(email?.href.includes(encodeURIComponent(url)));
});

test("strips the part of the address nobody reads", () => {
  assert.equal(shortenShareUrl("https://www.gofundme.com/f/help"), "gofundme.com/f/help");
  assert.equal(shortenShareUrl("http://example.com/"), "example.com");
  assert.equal(shortenShareUrl("https://example.com"), "example.com");
});

test("truncates long addresses rather than wrapping the sheet", () => {
  const long = shortenShareUrl(`https://example.com/${"a".repeat(80)}`);
  assert.ok(long.length <= 35, `got ${long.length} characters`);
  assert.ok(long.endsWith("…"));
});
