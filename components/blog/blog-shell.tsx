import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The blog's page chrome: the same sticky nav and footer the SEO resource
 * pages use, so a reader arriving from search sees one site, with the
 * article surface itself styled like a long-form reading page (see the
 * .blog-* rules in globals.css).
 */
export function BlogShell({ children }: { children: ReactNode }) {
  return (
    <main className="seo-page blog-page">
      <nav className="seo-nav" aria-label="Primary navigation">
        <Link className="seo-nav__brand" href="/" aria-label="Cueful home">
          cueful.
        </Link>
        <div>
          <Link href="/blog">Blog</Link>
          <Link href="/templates">Templates</Link>
          <Link className="seo-nav__secondary" href="/link-in-bio-tools">
            Compare tools
          </Link>
          <Link className="seo-button seo-button--small" href="/auth">
            Start free
          </Link>
        </div>
      </nav>

      {children}

      <footer className="seo-footer">
        <Link href="/">cueful.</Link>
        <p>Free link-in-bio pages for creators and small businesses.</p>
        <nav aria-label="Footer navigation">
          <Link href="/blog">Blog</Link>
          <Link href="/free-linktree-alternative">Switch from Linktree</Link>
          <Link href="/best-link-in-bio-tools">Compare tools</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </footer>
    </main>
  );
}

/** The small round mark used as the author avatar. */
export function AuthorMark({ size = 44 }: { size?: number }) {
  return (
    <span
      className="blog-author-mark"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      c.
    </span>
  );
}
