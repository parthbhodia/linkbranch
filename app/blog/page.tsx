import type { Metadata } from "next";
import Link from "next/link";
import { AuthorMark, BlogShell } from "@/components/blog/blog-shell";
import { BLOG_AUTHOR, blogPosts, formatPostDate } from "@/lib/blog/posts";
import { BRAND_NAME, BRAND_URL, DEFAULT_SOCIAL_IMAGE } from "@/lib/brand";
import { BLOG_IMAGE_SIZES } from "@/content/blog/images";
import Image from "next/image";

const TITLE = "The Cueful blog: practical guides for your link in bio";
const DESCRIPTION =
  "Short, practical guides on links in bios, WhatsApp order links, local shop pages and what to put behind the one link Instagram gives you.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/blog",
    siteName: BRAND_NAME,
    type: "website",
    images: [{ url: DEFAULT_SOCIAL_IMAGE, width: 1200, height: 630, alt: `${BRAND_NAME} blog` }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [DEFAULT_SOCIAL_IMAGE] },
};

export default function BlogIndexPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${BRAND_NAME} blog`,
    url: `${BRAND_URL}/blog`,
    description: DESCRIPTION,
    publisher: { "@type": "Organization", name: BRAND_NAME, url: BRAND_URL },
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: post.url,
      datePublished: post.published,
      dateModified: post.updated ?? post.published,
      image: `${BRAND_URL}${post.hero.src}`,
      author: { "@type": "Organization", name: BLOG_AUTHOR.name },
    })),
  };

  return (
    <BlogShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="blog-wrap">
        <header className="blog-index__header">
          <p className="blog-kicker">Blog</p>
          <h1>Practical guides for the one link you get.</h1>
          <p>
            Where the link goes, what to put behind it, and how a shop, a
            musician or a creator makes the tap worth something.
          </p>
        </header>

        <div className="blog-list">
          {blogPosts.map((post) => {
            const size = BLOG_IMAGE_SIZES[post.hero.src];
            return (
              <article className="blog-card" key={post.slug}>
                <div className="blog-card__body">
                  <p className="blog-card__author">
                    <AuthorMark size={22} />
                    <span>{BLOG_AUTHOR.name}</span>
                  </p>
                  <h2>
                    <Link href={post.path}>{post.title}</Link>
                  </h2>
                  <p className="blog-card__subtitle">{post.subtitle}</p>
                  <p className="blog-card__foot">
                    <time dateTime={post.published}>{formatPostDate(post.published)}</time>
                    <span aria-hidden="true">·</span>
                    <span>{post.readingTime} min read</span>
                    {post.tags[0] && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="blog-tag">{post.tags[0]}</span>
                      </>
                    )}
                  </p>
                </div>
                <Link className="blog-card__thumb" href={post.path} tabIndex={-1} aria-hidden="true">
                  {size ? (
                    <Image
                      src={post.hero.src}
                      alt=""
                      width={size.width}
                      height={size.height}
                      sizes="112px"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- size unknown until the manifest is regenerated
                    <img src={post.hero.src} alt="" loading="lazy" />
                  )}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </BlogShell>
  );
}
