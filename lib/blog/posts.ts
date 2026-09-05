import { BRAND_URL } from "@/lib/brand";
import {
  headingsOf,
  parseMarkdown,
  readingTimeMinutes,
  wordCount,
  type Block,
} from "@/lib/blog/markdown";
import { post as instagramBioLink } from "@/content/blog/how-to-add-link-in-instagram-bio";
import { post as whatsappLinkInBio } from "@/content/blog/whatsapp-link-in-bio";
import { post as localShopLinkInBio } from "@/content/blog/link-in-bio-for-local-shop";

/**
 * A post as written: metadata plus a Markdown body (see lib/blog/markdown.ts
 * for the supported subset). Posts live in content/blog, one file each, and
 * are registered in the list below. Newest first is computed, not curated.
 */
export type BlogSource = {
  slug: string;
  title: string;
  /** One sentence under the title, Medium-style. */
  subtitle: string;
  /** Meta description and social preview text. */
  description: string;
  /** ISO date, YYYY-MM-DD. */
  published: string;
  updated?: string;
  hero: { src: string; alt: string; caption?: string };
  tags: string[];
  /** The one page this post hands its reader to. */
  cta: { href: string; label: string; blurb: string };
  body: string;
};

export type BlogPost = BlogSource & {
  path: string;
  url: string;
  blocks: Block[];
  words: number;
  readingTime: number;
  headings: { id: string; text: string }[];
};

/** Posts are published by the team, not by a named individual. */
export const BLOG_AUTHOR = {
  name: "Cueful",
  description: "The people building cueful.bio",
};

function prepare(source: BlogSource): BlogPost {
  const blocks = parseMarkdown(source.body);
  const words = wordCount(blocks);
  return {
    ...source,
    path: `/blog/${source.slug}`,
    url: `${BRAND_URL}/blog/${source.slug}`,
    blocks,
    words,
    readingTime: readingTimeMinutes(words),
    headings: headingsOf(blocks),
  };
}

export const blogPosts: BlogPost[] = [instagramBioLink, whatsappLinkInBio, localShopLinkInBio]
  .map(prepare)
  .sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : 0));

export const blogPostBySlug = new Map(blogPosts.map((post) => [post.slug, post]));

/** Other posts to read next, newest first, excluding the current one. */
export function otherPosts(slug: string, limit = 3): BlogPost[] {
  return blogPosts.filter((post) => post.slug !== slug).slice(0, limit);
}

export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
