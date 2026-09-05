import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { BlogBlocks, BlogFigure } from "@/components/blog/blog-article";
import { AuthorMark, BlogShell } from "@/components/blog/blog-shell";
import {
  BLOG_AUTHOR,
  blogPostBySlug,
  blogPosts,
  formatPostDate,
  otherPosts,
} from "@/lib/blog/posts";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";

// Every post is known at build time, so the pages are static and an unknown
// slug is a 404 rather than a render attempt.
export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPostBySlug.get(slug);
  if (!post) return {};
  const image = `${BRAND_URL}${post.hero.src}`;
  return {
    title: `${post.title} | ${BRAND_NAME} blog`,
    description: post.description,
    alternates: { canonical: post.path },
    openGraph: {
      title: post.title,
      description: post.description,
      url: post.path,
      siteName: BRAND_NAME,
      type: "article",
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
      authors: [BRAND_URL],
      tags: post.tags,
      images: [{ url: image, alt: post.hero.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPostBySlug.get(slug);
  if (!post) notFound();

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      image: [`${BRAND_URL}${post.hero.src}`],
      datePublished: post.published,
      dateModified: post.updated ?? post.published,
      author: { "@type": "Organization", name: BLOG_AUTHOR.name, url: BRAND_URL },
      publisher: { "@type": "Organization", name: BRAND_NAME, url: BRAND_URL },
      mainEntityOfPage: { "@type": "WebPage", "@id": post.url },
      wordCount: post.words,
      keywords: post.tags.join(", "),
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BRAND_NAME, item: BRAND_URL },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${BRAND_URL}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: post.url },
      ],
    },
  ];

  const next = otherPosts(post.slug, 2);

  return (
    <BlogShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="blog-wrap blog-article">
        <header className="blog-article__header">
          <nav className="blog-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/blog">Blog</Link>
            <span aria-hidden="true">/</span>
            <span>{post.tags[0] ?? "Guide"}</span>
          </nav>
          <h1 className="blog-article__title">{post.title}</h1>
          <p className="blog-article__subtitle">{post.subtitle}</p>
          <div className="blog-byline">
            <AuthorMark />
            <div>
              <p className="blog-byline__name">{BLOG_AUTHOR.name}</p>
              <p className="blog-byline__meta">
                <span>{post.readingTime} min read</span>
                <span aria-hidden="true">·</span>
                <time dateTime={post.published}>{formatPostDate(post.published)}</time>
                {post.updated && post.updated !== post.published && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Updated {formatPostDate(post.updated)}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </header>

        <BlogFigure src={post.hero.src} alt={post.hero.alt} caption={post.hero.caption} priority hero />

        <div className="blog-body">
          <BlogBlocks blocks={post.blocks} />
        </div>

        <ul className="blog-tags" aria-label="Topics">
          {post.tags.map((tag) => (
            <li className="blog-tag" key={tag}>
              {tag}
            </li>
          ))}
        </ul>

        <aside className="blog-cta">
          <p className="blog-kicker">Try it</p>
          <h2>{post.cta.label}</h2>
          <p>{post.cta.blurb}</p>
          <Link className="seo-button" href={post.cta.href}>
            {post.cta.label}
            <ArrowForwardRounded aria-hidden="true" />
          </Link>
        </aside>

        {next.length > 0 && (
          <section className="blog-next" aria-labelledby="blog-next-heading">
            <h2 id="blog-next-heading">More from {BRAND_NAME}</h2>
            <div className="blog-next__list">
              {next.map((item) => (
                <Link className="blog-next__card" href={item.path} key={item.slug}>
                  <span className="blog-next__title">{item.title}</span>
                  <span className="blog-next__subtitle">{item.subtitle}</span>
                  <span className="blog-next__meta">
                    {formatPostDate(item.published)} · {item.readingTime} min read
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </BlogShell>
  );
}
