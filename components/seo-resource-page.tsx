import type { Metadata } from "next";
import Link from "next/link";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import { ImportStarter } from "@/components/import-starter";
import { BRAND_NAME, BRAND_URL, DEFAULT_SOCIAL_IMAGE } from "@/lib/brand";
import type { SeoPageConfig } from "@/lib/seo-pages";

export function metadataForSeoPage(page: SeoPageConfig): Metadata {
  const localizedAlternates =
    page.path === "/what-does-link-in-bio-mean" ||
    page.path === "/it/cosa-significa-link-in-bio" ||
    page.path === "/es/que-significa-link-en-bio"
      ? {
          en: `${BRAND_URL}/what-does-link-in-bio-mean`,
          es: `${BRAND_URL}/es/que-significa-link-en-bio`,
          it: `${BRAND_URL}/it/cosa-significa-link-in-bio`,
          "x-default": `${BRAND_URL}/what-does-link-in-bio-mean`,
        }
      : undefined;

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: page.path,
      languages: localizedAlternates,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: page.path,
      siteName: BRAND_NAME,
      type: "website",
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE,
          width: 1200,
          height: 630,
          alt: `${page.title} — Cueful`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
  };
}

function PreviewCard({ page }: { page: SeoPageConfig }) {
  return (
    <article className="seo-preview" aria-label={`${page.preview.category} profile example`}>
      <header className="seo-preview__meta">
        <span>{page.preview.category}</span>
        <ArrowOutwardRounded aria-hidden="true" />
      </header>
      <div className="seo-preview__phone">
        <div className="seo-preview__avatar">{page.preview.initials}</div>
        <small>{page.preview.handle}</small>
        <h2>
          {page.preview.headline} <em>{page.preview.accent}</em>
        </h2>
        <p>{page.preview.bio}</p>
        {page.preview.referral && (
          <div className="seo-preview__referral">
            <span>{page.preview.referral.provider} / REFERRAL</span>
            <b>{page.preview.referral.offer}</b>
            <button type="button" tabIndex={-1} aria-hidden="true">
              <ContentCopyRounded fontSize="small" />
              {page.preview.referral.code}
            </button>
          </div>
        )}
        <div className="seo-preview__links">
          {page.preview.links.map((label, index) => (
            <div key={label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{label}</b>
              <ArrowOutwardRounded aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export function SeoResourcePage({ page }: { page: SeoPageConfig }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${BRAND_URL}${page.path}#webpage`,
        url: `${BRAND_URL}${page.path}`,
        name: page.metaTitle,
        description: page.metaDescription,
        inLanguage: page.locale ?? "en",
        isPartOf: { "@id": `${BRAND_URL}/#website` },
        dateModified: "2026-07-28",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Cueful",
            item: BRAND_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: page.eyebrow,
            item: `${BRAND_URL}${page.path}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <main className={`seo-page seo-page--${page.theme}`} lang={page.locale ?? "en"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav className="seo-nav" aria-label="Primary navigation">
        <Link className="seo-nav__brand" href="/" aria-label="Cueful home">
          cueful.
        </Link>
        <div>
          <Link href="/link-in-bio-tools">Compare tools</Link>
          <Link href="/templates">Templates</Link>
          <Link className="seo-button seo-button--small" href="/auth">
            Start free
          </Link>
        </div>
      </nav>

      <header className="seo-hero">
        <div className="seo-hero__copy">
          <div className="seo-breadcrumbs">
            <Link href="/">Cueful</Link>
            <span>/</span>
            <span>{page.eyebrow}</span>
          </div>
          <p className="seo-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p className="seo-lead">{page.lead}</p>

          {page.path === "/free-linktree-alternative" ? (
            <div className="seo-import-panel">
              <ImportStarter />
            </div>
          ) : (
            <div className="seo-hero__actions">
              <Link className="seo-button" href={page.primaryHref}>
                {page.primaryCta}
                <ArrowForwardRounded aria-hidden="true" />
              </Link>
              {page.secondaryCta && page.secondaryHref && (
                <Link className="seo-text-link" href={page.secondaryHref}>
                  {page.secondaryCta}
                  <ArrowOutwardRounded aria-hidden="true" />
                </Link>
              )}
            </div>
          )}

          <div className="seo-proof" aria-label="Key facts">
            {page.proof.map((item) => (
              <div key={`${item.value}-${item.label}`}>
                <b>{item.value}</b>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <PreviewCard page={page} />
      </header>

      <section className="seo-section seo-section--intro" aria-labelledby="useful-by-design">
        <div>
          <p className="seo-eyebrow">USEFUL BY DESIGN</p>
          <h2 id="useful-by-design">Built around the decision a visitor needs to make.</h2>
        </div>
        <p>
          Each guide uses a real page structure, specific examples, and an honest
          description of what Cueful can do today.
        </p>
      </section>

      <section className="seo-insights" aria-label="Practical guidance">
        {page.sections.map((section, index) => (
          <article key={section.heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
            <ul>
              {section.bullets.map((bullet) => (
                <li key={bullet}>
                  <CheckRounded aria-hidden="true" />
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="seo-steps" aria-labelledby="seo-steps-title">
        <div className="seo-steps__heading">
          <p className="seo-eyebrow">A SHORT PATH</p>
          <h2 id="seo-steps-title">From idea to a public page.</h2>
        </div>
        <ol>
          {page.steps.map((step, index) => (
            <li key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {page.comparison && (
        <section className="seo-comparison" aria-labelledby="comparison-heading">
          <p className="seo-eyebrow">SIDE BY SIDE</p>
          <h2 id="comparison-heading">{page.comparison.heading}</h2>
          <p>{page.comparison.intro}</p>
          <div className="seo-table-wrap">
            <table>
              <thead>
                <tr>
                  {page.comparison.columns.map((column) => (
                    <th scope="col" key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page.comparison.rows.map((row) => (
                  <tr key={row[0]}>
                    <th scope="row">{row[0]}</th>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="seo-faq" aria-labelledby="faq-heading">
        <div>
          <p className="seo-eyebrow">COMMON QUESTIONS</p>
          <h2 id="faq-heading">The short answers.</h2>
        </div>
        <div>
          {page.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {page.sourceLinks && page.sourceLinks.length > 0 && (
        <aside className="seo-sources" aria-label="Sources">
          <b>PLAN DETAILS CHANGE</b>
          <span>Reviewed July 28, 2026. Confirm current details at the source:</span>
          {page.sourceLinks.map((source) => (
            <a href={source.href} target="_blank" rel="noreferrer" key={source.href}>
              {source.label}
              <ArrowOutwardRounded aria-hidden="true" />
            </a>
          ))}
        </aside>
      )}

      <section className="seo-related" aria-labelledby="related-heading">
        <div>
          <p className="seo-eyebrow">KEEP GOING</p>
          <h2 id="related-heading">The next useful page.</h2>
        </div>
        <div>
          {page.related.map((item, index) => (
            <Link href={item.href} key={item.href}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{item.label}</b>
              <ArrowOutwardRounded aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="seo-final-cta">
        <p className="seo-eyebrow">PUBLISH THE USEFUL VERSION</p>
        <h2>One page. Clear direction. Free to start.</h2>
        <Link className="seo-button" href={page.primaryHref}>
          {page.primaryCta}
          <ArrowForwardRounded aria-hidden="true" />
        </Link>
      </section>

      <footer className="seo-footer">
        <Link href="/">cueful.</Link>
        <p>Free link-in-bio pages for creators who value clarity.</p>
        <nav aria-label="Footer navigation">
          <Link href="/free-linktree-alternative">Switch from Linktree</Link>
          <Link href="/best-link-in-bio-tools">Compare tools</Link>
          <Link href="/templates">Templates</Link>
        </nav>
      </footer>
    </main>
  );
}
