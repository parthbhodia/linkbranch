import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  headingsOf,
  parseInline,
  parseMarkdown,
  readingTimeMinutes,
  slugifyHeading,
  wordCount,
} from "./markdown.ts";

describe("parseInline", () => {
  it("leaves plain text alone", () => {
    assert.deepEqual(parseInline("just words"), [{ type: "text", text: "just words" }]);
  });

  it("reads bold, italic, code and links", () => {
    assert.deepEqual(parseInline("a **b** *c* `d` [e](https://x.y)"), [
      { type: "text", text: "a " },
      { type: "strong", children: [{ type: "text", text: "b" }] },
      { type: "text", text: " " },
      { type: "em", children: [{ type: "text", text: "c" }] },
      { type: "text", text: " " },
      { type: "code", text: "d" },
      { type: "text", text: " " },
      { type: "link", href: "https://x.y", children: [{ type: "text", text: "e" }] },
    ]);
  });

  it("allows bold inside a link", () => {
    const [link] = parseInline("[**go**](/blog)");
    assert.equal(link.type, "link");
    assert.equal(link.type === "link" && link.children[0].type, "strong");
  });

  it("does not treat a lone asterisk as emphasis", () => {
    assert.deepEqual(parseInline("2 * 3"), [{ type: "text", text: "2 * 3" }]);
  });

  it("keeps angle brackets as text, never markup", () => {
    assert.deepEqual(parseInline("<script>x</script>"), [
      { type: "text", text: "<script>x</script>" },
    ]);
  });
});

describe("parseMarkdown", () => {
  it("splits paragraphs on blank lines and joins wrapped lines", () => {
    const blocks = parseMarkdown("one\ntwo\n\nthree");
    assert.equal(blocks.length, 2);
    assert.deepEqual(blocks[0], {
      type: "paragraph",
      children: [{ type: "text", text: "one two" }],
    });
  });

  it("reads headings with stable ids", () => {
    const [h2, h3] = parseMarkdown("## Where the link goes\n\n### On iPhone");
    assert.equal(h2.type, "heading");
    assert.equal(h2.type === "heading" && h2.level, 2);
    assert.equal(h2.type === "heading" && h2.id, "where-the-link-goes");
    assert.equal(h3.type === "heading" && h3.level, 3);
  });

  it("reads bullet and numbered lists, with wrapped items", () => {
    const [bullets, numbers] = parseMarkdown(
      "- first\n- second line\n  continues\n\n1. one\n2. two",
    );
    assert.equal(bullets.type, "list");
    assert.equal(bullets.type === "list" && bullets.ordered, false);
    assert.equal(bullets.type === "list" && bullets.items.length, 2);
    assert.deepEqual(bullets.type === "list" && bullets.items[1], [
      { type: "text", text: "second line continues" },
    ]);
    assert.equal(numbers.type === "list" && numbers.ordered, true);
  });

  it("reads a figure with an optional caption", () => {
    const [withCaption, without] = parseMarkdown(
      '![A profile](/blog/a.png "The page on a phone")\n\n![Plain](/blog/b.png)',
    );
    assert.deepEqual(withCaption, {
      type: "figure",
      src: "/blog/a.png",
      alt: "A profile",
      caption: "The page on a phone",
    });
    assert.equal(without.type === "figure" && without.caption, null);
  });

  it("reads quotes, rules, notes and fenced code", () => {
    const blocks = parseMarkdown(
      "> said\n> twice\n\n---\n\n:::note\nheads up\n:::\n\n```\nhttps://wa.me/1\n```",
    );
    assert.deepEqual(
      blocks.map((b) => b.type),
      ["quote", "rule", "note", "code"],
    );
    assert.equal(blocks[3].type === "code" && blocks[3].text, "https://wa.me/1");
  });

  it("does not turn a paragraph starting with a number into a list", () => {
    const [p] = parseMarkdown("2023 was the year Instagram allowed five links.");
    assert.equal(p.type, "paragraph");
  });
});

describe("wordCount / readingTimeMinutes", () => {
  it("counts readable words and ignores figures and code", () => {
    const blocks = parseMarkdown(
      "## Two words\n\nfour more words here\n\n![x](/a.png)\n\n```\nnot counted at all\n```\n\n- one\n- two",
    );
    assert.equal(wordCount(blocks), 8);
  });

  it("never reports under a minute and rounds up", () => {
    assert.equal(readingTimeMinutes(0), 1);
    assert.equal(readingTimeMinutes(265), 1);
    assert.equal(readingTimeMinutes(266), 2);
  });
});

describe("headingsOf / slugifyHeading", () => {
  it("lists only level-two headings", () => {
    assert.deepEqual(headingsOf(parseMarkdown("## A\n\n### B\n\n## C")), [
      { id: "a", text: "A" },
      { id: "c", text: "C" },
    ]);
  });

  it("drops apostrophes rather than turning them into dashes", () => {
    assert.equal(slugifyHeading("What’s in a shop’s bio"), "whats-in-a-shops-bio");
  });
});
