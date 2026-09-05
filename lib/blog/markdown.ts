/**
 * The subset of Markdown the blog posts are written in, parsed to a small
 * block tree that blog-article.tsx renders as React elements.
 *
 * Hand-rolled rather than a dependency for two reasons. The posts are ours,
 * so the syntax only has to cover what we write; and rendering to elements
 * rather than to an HTML string means nothing a post contains can ever become
 * markup by accident -- there is no innerHTML anywhere in the pipeline.
 *
 * Supported:
 *   ## Heading, ### Heading
 *   paragraphs (blank-line separated), with **bold**, *italic*, `code`,
 *     [text](href)
 *   - bullet lists, 1. numbered lists (one level)
 *   > quotes
 *   ![alt](src "caption")   -- a figure; caption optional
 *   ```  fenced code  ```
 *   ---  a section break
 *   :::note ... :::   -- a callout box
 * Anything else is a paragraph.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: Inline[] };

export type Block =
  | { type: "heading"; level: 2 | 3; text: string; id: string; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; children: Inline[] }
  | { type: "figure"; src: string; alt: string; caption: string | null }
  | { type: "code"; text: string }
  | { type: "rule" }
  | { type: "note"; children: Inline[] };

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Inline parsing: one left-to-right pass looking for the earliest opener.
// Links are handled first at each position so `[**x**](y)` works; the other
// three do not nest inside each other beyond what a post actually needs.
export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let text = "";
  let i = 0;

  const flush = () => {
    if (text) {
      out.push({ type: "text", text });
      text = "";
    }
  };

  while (i < source.length) {
    const rest = source.slice(i);

    const link = rest.match(/^\[([^\]]+)\]\(([^)\s]+)\)/);
    if (link) {
      flush();
      out.push({ type: "link", href: link[2], children: parseInline(link[1]) });
      i += link[0].length;
      continue;
    }

    const code = rest.match(/^`([^`]+)`/);
    if (code) {
      flush();
      out.push({ type: "code", text: code[1] });
      i += code[0].length;
      continue;
    }

    const strong = rest.match(/^\*\*([^*]+)\*\*/);
    if (strong) {
      flush();
      out.push({ type: "strong", children: parseInline(strong[1]) });
      i += strong[0].length;
      continue;
    }

    const em = rest.match(/^\*([^*]+)\*/);
    if (em) {
      flush();
      out.push({ type: "em", children: parseInline(em[1]) });
      i += em[0].length;
      continue;
    }

    text += source[i];
    i += 1;
  }
  flush();
  return out;
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  const paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ").trim()) });
      paragraph.length = 0;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushParagraph();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }

    if (trimmed === ":::note") {
      flushParagraph();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && lines[i].trim() !== ":::") {
        body.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "note", children: parseInline(body.join(" ").trim()) });
      continue;
    }

    const heading = trimmed.match(/^(##|###)\s+(.+?)\s*$/);
    if (heading) {
      flushParagraph();
      const text = heading[2];
      blocks.push({
        type: "heading",
        level: heading[1] === "##" ? 2 : 3,
        text,
        id: slugifyHeading(text),
        children: parseInline(text),
      });
      i += 1;
      continue;
    }

    if (trimmed === "---") {
      flushParagraph();
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }

    const figure = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (figure) {
      flushParagraph();
      blocks.push({ type: "figure", src: figure[2], alt: figure[1], caption: figure[3] ?? null });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      const body: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        body.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push({ type: "quote", children: parseInline(body.join(" ")) });
      continue;
    }

    const bullet = /^[-*]\s+/;
    const numbered = /^\d+\.\s+/;
    if (bullet.test(trimmed) || numbered.test(trimmed)) {
      flushParagraph();
      const ordered = numbered.test(trimmed);
      const marker = ordered ? numbered : bullet;
      const items: Inline[][] = [];
      while (i < lines.length && marker.test(lines[i].trim())) {
        // A list item may wrap onto indented continuation lines.
        let item = lines[i].trim().replace(marker, "");
        i += 1;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !marker.test(lines[i].trim())) {
          item += " " + lines[i].trim();
          i += 1;
        }
        items.push(parseInline(item));
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    paragraph.push(trimmed);
    i += 1;
  }
  flushParagraph();
  return blocks;
}

function inlineText(nodes: Inline[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
        case "code":
          return node.text;
        default:
          return inlineText(node.children);
      }
    })
    .join("");
}

/** Words in the readable text, figures and code excluded. */
export function wordCount(blocks: Block[]): number {
  let count = 0;
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
      case "paragraph":
      case "quote":
      case "note":
        count += inlineText(block.children).split(/\s+/).filter(Boolean).length;
        break;
      case "list":
        for (const item of block.items) {
          count += inlineText(item).split(/\s+/).filter(Boolean).length;
        }
        break;
      default:
        break;
    }
  }
  return count;
}

/** Medium's own convention: 265 words a minute, rounded up, never under 1. */
export function readingTimeMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 265));
}

/** Section headings, for a table of contents. */
export function headingsOf(blocks: Block[]) {
  return blocks.flatMap((block) =>
    block.type === "heading" && block.level === 2 ? [{ id: block.id, text: block.text }] : [],
  );
}
