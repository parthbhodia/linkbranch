import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BLOG_IMAGE_SIZES } from "@/content/blog/images";
import type { Block, Inline } from "@/lib/blog/markdown";

function renderInline(nodes: Inline[], prefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${prefix}-${index}`;
    switch (node.type) {
      case "text":
        return node.text;
      case "strong":
        return <strong key={key}>{renderInline(node.children, key)}</strong>;
      case "em":
        return <em key={key}>{renderInline(node.children, key)}</em>;
      case "code":
        return <code key={key}>{node.text}</code>;
      case "link":
        return node.href.startsWith("/") ? (
          <Link key={key} href={node.href}>
            {renderInline(node.children, key)}
          </Link>
        ) : (
          <a key={key} href={node.href} target="_blank" rel="noreferrer">
            {renderInline(node.children, key)}
          </a>
        );
    }
  });
}

export function BlogFigure({
  src,
  alt,
  caption,
  priority = false,
  hero = false,
}: {
  src: string;
  alt: string;
  caption?: string | null;
  priority?: boolean;
  hero?: boolean;
}) {
  const size = BLOG_IMAGE_SIZES[src];
  // A phone screenshot at full column width would be taller than the screen
  // it came from; portrait images are shown at roughly phone size instead.
  const portrait = size ? size.height > size.width * 1.2 : false;
  const className = [
    "blog-figure",
    hero ? "blog-figure--hero" : "",
    portrait ? "blog-figure--portrait" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <figure className={className}>
      {size ? (
        <Image
          src={src}
          alt={alt}
          width={size.width}
          height={size.height}
          sizes={portrait ? "(max-width: 720px) 80vw, 380px" : "(max-width: 720px) 100vw, 680px"}
          priority={priority}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- size unknown until the manifest is regenerated
        <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} />
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function BlogBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2 key={key} id={block.id}>
                {renderInline(block.children, key)}
              </h2>
            ) : (
              <h3 key={key} id={block.id}>
                {renderInline(block.children, key)}
              </h3>
            );
          case "paragraph":
            return <p key={key}>{renderInline(block.children, key)}</p>;
          case "list":
            return block.ordered ? (
              <ol key={key}>
                {block.items.map((item, i) => (
                  <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
                ))}
              </ol>
            ) : (
              <ul key={key}>
                {block.items.map((item, i) => (
                  <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
                ))}
              </ul>
            );
          case "quote":
            return <blockquote key={key}>{renderInline(block.children, key)}</blockquote>;
          case "figure":
            return (
              <BlogFigure key={key} src={block.src} alt={block.alt} caption={block.caption} />
            );
          case "code":
            return (
              <pre key={key}>
                <code>{block.text}</code>
              </pre>
            );
          case "rule":
            return (
              <div key={key} className="blog-rule" role="separator">
                <span>·</span>
                <span>·</span>
                <span>·</span>
              </div>
            );
          case "note":
            return (
              <aside key={key} className="blog-note">
                {renderInline(block.children, key)}
              </aside>
            );
        }
      })}
    </>
  );
}
