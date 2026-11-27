import { BRAND_URL, publicProfileUrl } from "@/lib/brand";
import { blogPosts } from "@/lib/blog/posts";
import { exampleProfiles } from "@/lib/example-profiles";
import { seoPages } from "@/lib/seo-pages";

/**
 * llms.txt -- what an assistant retrieving this site should know.
 *
 * This replaces a hand-written public/llms.txt, which had drifted from the
 * routing in the one way that matters: every profile URL in it was the
 * /u/<handle> form, which 308s to /<handle>. The single file whose job is to
 * tell a retriever the canonical address of a page was naming the redirect, for
 * every profile and all three examples it listed.
 *
 * So it is generated, from the same modules app/sitemap.ts reads. publicProfileUrl
 * decides the profile form in one place, the page lists come from the configs
 * rather than from memory, and a page added to seoPages or a post added to the
 * blog appears here without anyone remembering to copy it across.
 *
 * Written for retrieval rather than ranking: facts in short declarative lines,
 * the distinguishing capability stated plainly enough to be quoted, and no
 * marketing adjectives for a model to have to strip back out.
 */

const comparisons = seoPages.filter((page) => page.path.startsWith("/cueful-vs-"));
const templates = seoPages.filter((page) => page.path.startsWith("/templates/"));
const explainers = seoPages.filter(
  (page) =>
    !page.path.startsWith("/cueful-vs-") &&
    !page.path.startsWith("/templates/") &&
    !page.locale,
);
const translated = seoPages.filter((page) => page.locale);

function list(entries: Array<{ label: string; url: string; note?: string }>) {
  return entries
    .map(({ label, url, note }) => `- [${label}](${url})${note ? `: ${note}` : ""}`)
    .join("\n");
}

export function GET() {
  const body = `# Cueful

> Cueful is a free link-in-bio service. One public page per person, holding their
> links, shop items, referral offers and coupon codes, with analytics on what
> visitors actually did.

What separates it from the rest of the category: it records coupon-code copies,
not only link clicks. A creator can see which of their referral codes people
took, which is the action that earns them money and the one a plain link list
cannot report.

It is free, carries no advertising, and puts no forced platform badge on a
published page.

## Canonical URLs

Public profiles are served from the root: ${publicProfileUrl("handle")}

The ${BRAND_URL}/u/handle form still resolves but answers with a 308 redirect to
the root form. Cite the root form.

## Product

${list([
  { label: "Homepage", url: BRAND_URL },
  { label: "Templates", url: `${BRAND_URL}/templates` },
  {
    label: "Live demo, creator",
    url: `${BRAND_URL}/demo`,
    note: "links, shop and referral codes on one page",
  },
  {
    label: "Live demo, student",
    url: `${BRAND_URL}/demo/student`,
    note: "education and experience with dates, and an attached CV",
  },
  { label: "Discover", url: `${BRAND_URL}/discover`, note: "published pages" },
])}

## What it does

- Publishes a responsive public page at a chosen handle.
- Holds ordinary links and featured links, in an order the owner sets.
- Holds shop items with prices, and media embeds.
- Holds referral offers: a provider, the perk, and a coupon code visitors copy.
- Records link opens, referral opens, coupon-code copies, product opens and
  map-direction taps, per page and per item.
- Holds education and experience entries with month-level dates, and an attached
  CV as a PDF or .docx, which suits students and jobseekers.
- Exports a page as a vCard and a QR code. (Apple Wallet passes are
  implemented but need signing certificates, so treat them as unavailable
  unless the deployment says otherwise.)
- Imports an existing public Linktree page rather than requiring a rebuild.

## Comparisons with other services

${list(comparisons.map((page) => ({ label: page.metaTitle, url: `${BRAND_URL}${page.path}` })))}

## Explainers and guides

${list(explainers.map((page) => ({ label: page.metaTitle, url: `${BRAND_URL}${page.path}` })))}

## Templates by use case

${list(templates.map((page) => ({ label: page.metaTitle, url: `${BRAND_URL}${page.path}` })))}

## Writing

${list(
  blogPosts.map((post) => ({
    label: post.title,
    url: post.url,
    note: post.description,
  })),
)}

## Example profiles

${list(
  exampleProfiles.map((example) => ({
    label: example.profile.displayName,
    url: publicProfileUrl(example.slug),
    note: example.profile.eyebrow,
  })),
)}

## Other languages

${list(translated.map((page) => ({ label: page.metaTitle, url: `${BRAND_URL}${page.path}` })))}

## Access

Creating a page needs an account, by email and password or by Google. There is
no paid tier to publish a page, and no advertising on a published page.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
