"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import { Button, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { BrandMark } from "@/components/brand-mark";
import { ImportStarter } from "@/components/import-starter";
import { UsernameClaim } from "@/components/username-claim";
import { exampleProfiles } from "@/lib/example-profiles";
import { musicProviders } from "@/lib/music-providers";
import {
  getSocialPlatformIcon,
  socialPlatformOptions,
} from "@/lib/social-platforms";
import { BRAND_DOMAIN, publicProfilePath } from "@/lib/brand";
import { captureReferralFromLocation } from "@/lib/referrals";
import { createClient } from "@/lib/supabase/client";

function formatTaps(total: number) {
  if (total >= 1000) {
    return `${(total / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(total);
}

// Tiles pull their glyphs from the real provider registries rather than from a
// separate set of brand logos, so the row can only ever show something the
// product actually embeds or links.
const musicIconByLabel = new Map(
  musicProviders.map((provider) => [provider.label, provider.icon]),
);

// Socials first: that registry carries real brand marks, where the music one
// falls back to generic glyphs (YouTube, Twitch and Vimeo all share a camera).
function integrationIcon(label: string) {
  const social = socialPlatformOptions.find((option) => option.label === label);
  return social?.icon ?? musicIconByLabel.get(label) ?? getSocialPlatformIcon(label);
}

// Picked so all six marks are visually distinct -- adding Twitch or Vimeo here
// would repeat the camera glyph twice over.
const integrationTiles = [
  { label: "Spotify", tone: "lime" },
  { label: "YouTube", tone: "rust" },
  { label: "Instagram", tone: "sky" },
  { label: "SoundCloud", tone: "violet" },
  { label: "WhatsApp Business", tone: "lime" },
  { label: "Apple Music", tone: "sky" },
];

// A decorative stand-in for the QR the share dialog generates -- deterministic
// so it never changes between renders, with the three finder squares a real
// code has. Not scannable, and not meant to be.
const QR_GRID = 11;
const qrCells = Array.from({ length: QR_GRID * QR_GRID }, (_, index) => {
  const row = Math.floor(index / QR_GRID);
  const column = index % QR_GRID;
  const inFinder = (r: number, c: number) =>
    r < 3 && (c < 3 || c > QR_GRID - 4);
  if (inFinder(row, column) || inFinder(QR_GRID - 1 - row, column)) {
    return true;
  }
  return (row * 7 + column * 3) % 5 < 2;
});

// PLACEHOLDER TESTIMONIAL -- not a real customer quote.
// Nova is the same invented persona (and the same stock portrait) used in the
// examples carousel above, deliberately: reusing an established illustration
// reads as a sample, where a new name and face would read as a real endorsement
// the product has not earned. Replace the whole block with a quote from a named
// customer who has given permission before this ships to production.
const testimonial = {
  quote:
    "I stopped sending people to a wall of links. One page, the drop up top, and I can see which line actually got opened.",
  name: "Nova",
  role: "Musician · Cueful example page",
  avatar: "/marketing/hero-collage-portrait-round.jpg",
};

const homepageFeatures = [
  {
    href: "/templates/referral-links-for-creators",
    theme: "ink",
    title: "Grow with referral cards.",
    body: "Put offers and codes in one tap-friendly block—copy tracking included, free forever.",
    image: "/marketing/feature-referrals.png",
    alt: "Cueful referral card with a one-tap copy code on a mobile profile",
    cta: "Referral template",
  },
  {
    href: "/templates/link-in-bio-shop",
    theme: "lagoon",
    title: "Earn income from your bio.",
    body: "Image-forward shop cards with price and buy buttons that open your own checkout—Cueful takes 0%.",
    image: "/marketing/feature-shop.png",
    alt: "Cueful shop cards with product images, prices, and buy buttons",
    cta: "Shop template",
  },
  {
    href: "/templates/spotify-embed-link-in-bio",
    theme: "lilac",
    title: "Play music. Embed video.",
    body: "Spotify players and YouTube embeds sit on the page so fans listen and watch without leaving.",
    image: "/marketing/feature-music.png",
    alt: "Cueful Spotify music embed playing on a mobile profile",
    cta: "Music template",
  },
];

const heroCollage = [
  {
    src: "/marketing/hero-collage-friends.jpg",
    alt: "Creators laughing together outdoors",
    className: "marketing-hero-collage__tile--friends",
  },
  {
    src: "/marketing/hero-collage-portrait-round.jpg",
    alt: "Creator wearing a mustard beanie",
    className: "marketing-hero-collage__tile--round",
  },
  {
    src: "/marketing/hero-collage-portrait-tall.jpg",
    alt: "Creator outdoors in a purple beanie",
    className: "marketing-hero-collage__tile--tall",
  },
  {
    src: "/marketing/hero-collage-statement.jpg",
    alt: "Creator with blue braids blowing bubblegum",
    className: "marketing-hero-collage__tile--statement",
  },
];

export function MarketingHome() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [activeExample, setActiveExample] = useState(0);
  const examplesRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    captureReferralFromLocation();
    let active = true;
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setIsSignedIn(Boolean(data.user));
      });
    return () => {
      active = false;
    };
  }, []);

  function showExample(index: number) {
    const nextIndex =
      (index + exampleProfiles.length) % exampleProfiles.length;
    const rail = examplesRailRef.current;
    const card = rail?.children.item(nextIndex);

    setActiveExample(nextIndex);
    card?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
      inline: "start",
    });
  }

  function updateActiveExample() {
    const rail = examplesRailRef.current;
    if (!rail) return;

    const railStart = rail.getBoundingClientRect().left;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(rail.children).forEach((card, index) => {
      const bounds = card.getBoundingClientRect();
      const distance = Math.abs(bounds.left - railStart);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveExample(nearestIndex);
  }

  return (
    <main className="marketing-home" id="main-content">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <nav className="marketing-nav" aria-label="Primary navigation">
        <BrandMark className="brand marketing-nav__brand" />
        <div className="marketing-nav__links">
          <Button component={Link} href="#features" color="inherit">
            Features
          </Button>
          <Button component={Link} href="#examples" color="inherit">
            Examples
          </Button>
          <Button component={Link} href="/link-in-bio-tools" color="inherit">
            Compare tools
          </Button>
          {/* Nothing else in the app links to the editor, so a signed-in user
              landing here had no route back to it — the button said "Sign in"
              even though /auth redirects them straight to the dashboard. */}
          <Button
            component={Link}
            href={isSignedIn ? "/dashboard" : "/auth?mode=login"}
            color="inherit"
          >
            {isSignedIn ? "Dashboard" : "Sign in"}
          </Button>
          <Button
            component={Link}
            href="/auth"
            variant="contained"
            endIcon={<ArrowForwardRounded aria-hidden="true" />}
          >
            Start free
          </Button>
        </div>
      </nav>

      <section className="marketing-hero">
        <div className="marketing-hero__copy">
          <Chip
            className="marketing-kicker"
            label="LINKS · OFFERS · SIGNALS"
            variant="outlined"
          />
          <Typography component="h1">
            One free link for
            <br />
            <span>everything you create.</span>
          </Typography>
          <Typography className="marketing-hero__body">
            Build a customizable, ad-free link-in-bio page for Instagram,
            TikTok, YouTube, and every other platform.
          </Typography>
          <div className="marketing-hero__claim">
            <span>CLAIM YOUR CUEFUL URL</span>
            <Typography component="p">
              Pick your username now. You can add links and choose a design
              after creating your account.
            </Typography>
            <UsernameClaim />
          </div>
          <div
            className={`marketing-import-option${importOpen ? " is-open" : ""}`}
          >
            <button
              type="button"
              className="marketing-import-option__toggle"
              aria-expanded={importOpen}
              aria-controls="linktree-import-panel"
              onClick={() => setImportOpen((open) => !open)}
            >
              <span>Already use Linktree?</span>
              Import your page instead
            </button>
            {importOpen && (
              <div id="linktree-import-panel">
                <ImportStarter compact />
              </div>
            )}
          </div>
          <div className="marketing-hero__trust" aria-label="Signup benefits">
            <span>
              <CheckRounded aria-hidden="true" /> Free username
            </span>
            <span>
              <CheckRounded aria-hidden="true" /> No forced branding
            </span>
          </div>
        </div>

        <div
          className="marketing-hero-collage"
          aria-label="Creators growing with Cueful"
        >
          {heroCollage.map((tile) => (
            <figure
              className={`marketing-hero-collage__tile ${tile.className}`}
              key={tile.src}
            >
              <Image
                src={tile.src}
                alt={tile.alt}
                fill
                sizes="(max-width: 900px) 45vw, 280px"
                priority
              />
            </figure>
          ))}
        </div>
      </section>

      <section className="marketing-features" id="features">
        <div className="marketing-features__heading">
          <div>
            <p className="section-label">FREE FOREVER</p>
            <Typography component="h2">
              Built for the jobs in your bio.
            </Typography>
          </div>
          <Typography>
            Referral cards, shop grids, music and video embeds—without visitor
            ads or a Cueful cut of sales.
          </Typography>
        </div>
        <div className="marketing-features__grid">
          {homepageFeatures.map((feature) => (
            <Link
              className={`marketing-feature-card marketing-feature-card--${feature.theme}`}
              href={feature.href}
              key={feature.href}
            >
              <span className="marketing-feature-card__media">
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  width={720}
                  height={720}
                  sizes="(max-width: 900px) 80vw, 280px"
                  priority={feature.theme === "ink"}
                />
              </span>
              <span className="marketing-feature-card__copy">
                <b>{feature.title}</b>
                <small>{feature.body}</small>
                <em>
                  {feature.cta}{" "}
                  <ArrowOutwardRounded fontSize="inherit" aria-hidden="true" />
                </em>
              </span>
            </Link>
          ))}
        </div>
        <div className="marketing-features__footer">
          <Button
            component={Link}
            href="/cueful-vs-linktree"
            variant="outlined"
            endIcon={<ArrowForwardRounded aria-hidden="true" />}
          >
            Cueful vs Linktree
          </Button>
        </div>
      </section>

      <section className="marketing-examples" id="examples">
        <div className="marketing-examples__heading">
          <div>
            <p className="section-label">SIX STARTING POINTS</p>
            <Typography component="h2">Pick the page that fits.</Typography>
          </div>
          <Typography>
            Musician with Spotify embed, coach with Calendly, creator, freelancer, curator, or shop.
          </Typography>
        </div>
        <div className="example-carousel">
          <div className="example-carousel__toolbar">
            <div
              className="example-carousel__pagination"
              aria-label={`Example ${activeExample + 1} of ${exampleProfiles.length}`}
              aria-live="polite"
            >
              <span>0{activeExample + 1}</span>
              <i aria-hidden="true" />
              <span>0{exampleProfiles.length}</span>
            </div>
            <div className="example-carousel__controls">
              <Tooltip title="Previous example">
                <IconButton
                  aria-label="Previous example"
                  onClick={() => showExample(activeExample - 1)}
                >
                  <ChevronLeftRounded aria-hidden="true" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Next example">
                <IconButton
                  aria-label="Next example"
                  onClick={() => showExample(activeExample + 1)}
                >
                  <ChevronRightRounded aria-hidden="true" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <div
            className="example-profile-grid"
            ref={examplesRailRef}
            onScroll={updateActiveExample}
            aria-label="Example Cueful profiles"
          >
            {exampleProfiles.map((example, index) => (
              <Link
                className={`example-profile example-profile--${example.template}${
                  activeExample === index ? " is-active" : ""
                }`}
                href={publicProfilePath(example.slug)}
                aria-label={`Open ${example.profile.displayName}'s ${example.role} profile`}
                aria-current={activeExample === index ? "true" : undefined}
                key={example.slug}
              >
                <div className="example-profile__meta">
                  <span>0{index + 1} / {example.role.toUpperCase()}</span>
                  <ArrowOutwardRounded aria-hidden="true" />
                </div>
                <div className="example-profile__phone">
                  <i className={example.profile.avatarUrl ? "has-photo" : undefined}>
                    {example.profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={example.profile.avatarUrl} alt="" />
                    ) : (
                      example.profile.initials
                    )}
                  </i>
                  <small>@{example.profile.username}</small>
                  <b>
                    {example.profile.headline}
                    <em> {example.profile.headlineAccent}</em>
                  </b>
                  {example.profile.socials.length > 0 && (
                    <span className="example-profile__socials" aria-hidden="true">
                      {example.profile.socials.slice(0, 4).map((social) => (
                        <i key={social.platform}>
                          {getSocialPlatformIcon(social.platform)}
                        </i>
                      ))}
                    </span>
                  )}
                  {example.mediaEmbeds?.[0] ? (
                    <span className="example-profile__music">
                      <strong>▶ {example.mediaEmbeds[0].title}</strong>
                      <em>{example.mediaEmbeds[0].provider.replace("_", " ")} embed</em>
                    </span>
                  ) : null}
                  {example.products?.length
                    ? example.products.slice(0, 2).map((product) => (
                        <span
                          className={`example-profile__shop${
                            product.is_featured
                              ? " example-profile__shop--featured"
                              : ""
                          }${
                            product.image_path
                              ? " example-profile__shop--media"
                              : ""
                          }`}
                          key={product.id}
                        >
                          {product.image_path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              className="example-profile__shop-photo"
                              src={product.image_path}
                              alt=""
                            />
                          ) : null}
                          <span className="example-profile__shop-copy">
                            <em>
                              {product.badge ? `${product.badge} · ` : ""}
                              {product.category}
                            </em>
                            <strong>{product.title}</strong>
                            <span className="example-profile__shop-meta">
                              <b>
                                {product.price_amount != null
                                  ? `${product.currency} ${product.price_amount}`
                                  : "See details"}
                              </b>
                              <i>{product.cta_label || "Buy"}</i>
                            </span>
                          </span>
                        </span>
                      ))
                    : null}
                  {!example.products?.length &&
                  /referral/i.test(example.role) &&
                  example.profile.referrals?.length
                    ? example.profile.referrals.slice(0, 2).map((referral) => (
                        <span
                          className="example-profile__referral"
                          style={{
                            background: referral.color || undefined,
                          }}
                          key={referral.id}
                        >
                          <em>{referral.provider.toUpperCase()} / REFERRAL</em>
                          <strong>{referral.perk}</strong>
                          <span className="example-profile__referral-meta">
                            {referral.code ? (
                              <i>Copy · {referral.code}</i>
                            ) : (
                              <i>Open offer</i>
                            )}
                          </span>
                        </span>
                      ))
                    : null}
                  {!example.products?.length &&
                  !(/referral/i.test(example.role) &&
                    example.profile.referrals?.length)
                    ? example.profile.links
                        .slice(0, example.mediaEmbeds?.length ? 2 : 3)
                        .map((link) => {
                          const isBooking =
                            /calendly|cal\.com|tidycal|savvycal|hubspot|calendar\.google/i.test(
                              link.url,
                            );
                          const isMusic =
                            /spotify|music\.apple|soundcloud|youtube|bandcamp|audiomack/i.test(
                              link.url,
                            );
                          return (
                            <span
                              className={`example-profile__link${
                                isBooking
                                  ? " example-profile__link--booking"
                                  : ""
                              }${isMusic ? " example-profile__link--music" : ""}`}
                              key={link.id}
                            >
                              <strong>
                                {isBooking ? "📅 " : isMusic ? "♪ " : ""}
                                {link.title}
                              </strong>
                              <em>
                                {isBooking
                                  ? "Book a call"
                                  : isMusic
                                    ? "Music / video"
                                    : link.subtitle}
                              </em>
                            </span>
                          );
                        })
                    : null}
                  {/* Pinned to the bottom of the frame. The preview shows at
                      most three rows, so without something holding the floor a
                      short example leaves the phone visibly half-empty. */}
                  <span className="example-profile__stats" aria-hidden="true">
                    <b>
                      {formatTaps(
                        example.profile.links.reduce(
                          (total, link) => total + link.visits,
                          0,
                        ),
                      )}{" "}
                      taps
                    </b>
                    <b>{example.profile.links.length} links</b>
                  </span>
                </div>
                <div>
                  <Typography component="h3">{example.profile.displayName}</Typography>
                  <Typography>{example.profile.bio}</Typography>
                </div>
              </Link>
            ))}
          </div>
          <div className="example-carousel__dots" aria-label="Choose an example">
            {exampleProfiles.map((example, index) => (
              <button
                type="button"
                className={activeExample === index ? "is-active" : ""}
                aria-label={`Show ${example.role} example`}
                aria-pressed={activeExample === index}
                onClick={() => showExample(index)}
                key={example.slug}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-control">
        <div className="marketing-control__copy">
          <p className="section-label">AFTER THE TAP</p>
          <Typography component="h2">
            Control how your page
            <br />
            <span>gets used.</span>
          </Typography>
          <Typography>
            Put the track, the clip, or the stream inline so it plays without
            leaving the page. Sell from product cards that hand off to your own
            checkout. Share a QR that points at the same link as your bio.
          </Typography>
          <Button
            component={Link}
            href="/auth"
            variant="outlined"
            endIcon={<ArrowForwardRounded aria-hidden="true" />}
          >
            Start free
          </Button>
        </div>

        <div className="marketing-control__stage" aria-hidden="true">
          <figure className="marketing-control__card marketing-control__card--qr">
            <div className="marketing-control__qr">
              {qrCells.map((filled, index) => (
                <span key={index} data-on={filled ? "" : undefined} />
              ))}
            </div>
            <figcaption>Share your page</figcaption>
          </figure>

          <figure className="marketing-control__card marketing-control__card--phone">
            <span className="marketing-control__handle">
              {BRAND_DOMAIN}/nova-sounds
            </span>
            <b>Midnight Signal</b>
            <em>Tour tickets</em>
            <em>Merch drop</em>
            <em>Join the mailing list</em>
          </figure>

          <figure className="marketing-control__card marketing-control__card--player">
            <PlayArrowRounded aria-hidden="true" />
            <div>
              <b>Midnight Signal</b>
              <i />
            </div>
          </figure>

          <figure className="marketing-control__card marketing-control__card--offer">
            <small>AIRALO / REFERRAL</small>
            <b>$3 off your first travel eSIM</b>
            <span>COPY · DANI3</span>
          </figure>

          <div className="marketing-control__socials">
            {["Instagram", "Twitch", "YouTube"].map((platform) => (
              <span key={platform}>{getSocialPlatformIcon(platform)}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-integrations">
        <div className="marketing-integrations__copy">
          <p className="section-label">PLAYS WELL WITH</p>
          <Typography component="h2">
            Works with what you
            <br />
            <span>already publish on.</span>
          </Typography>
          <Typography>
            Paste a link from Spotify, Apple Music, SoundCloud, Bandcamp,
            Audiomack, YouTube, Vimeo, or Twitch and it embeds on your page.
            Fourteen social platforms sit in the header, WhatsApp Business
            included.
          </Typography>
          <Button
            component={Link}
            href="/auth"
            variant="contained"
            endIcon={<ArrowForwardRounded aria-hidden="true" />}
          >
            Create your page
          </Button>
        </div>

        <div className="marketing-integrations__grid">
          {integrationTiles.slice(0, 3).map((tile) => (
            <span
              className="marketing-integrations__tile"
              data-tone={tile.tone}
              key={tile.label}
              title={tile.label}
            >
              {integrationIcon(tile.label)}
            </span>
          ))}

          <span className="marketing-integrations__pill">
            {BRAND_DOMAIN}/you
          </span>

          {integrationTiles.slice(3).map((tile) => (
            <span
              className="marketing-integrations__tile"
              data-tone={tile.tone}
              key={tile.label}
              title={tile.label}
            >
              {integrationIcon(tile.label)}
            </span>
          ))}
        </div>
      </section>

      <section className="marketing-evidence">
        <div>
          <p className="section-label">MEASURE THE ACTION</p>
          <Typography component="h2">Know what moved.</Typography>
          <Typography>
            Link opens, offer opens, and code copies. Nothing ornamental.
          </Typography>
        </div>
        <div className="marketing-evidence__stats">
          <article><small>LINK OPENS</small><b>184</b><span>Top: Field notes</span></article>
          <article><small>OFFER OPENS</small><b>92</b><span>+18% this week</span></article>
          <article><small>CODE COPIES</small><b>67</b><span>36% copy rate</span></article>
        </div>
      </section>

      <section className="marketing-voice">
        <figure className="marketing-voice__portrait">
          <Image
            src={testimonial.avatar}
            alt=""
            fill
            sizes="(max-width: 700px) 70vw, 420px"
          />
        </figure>
        <blockquote>
          <Typography component="p">“{testimonial.quote}”</Typography>
        </blockquote>
        <figcaption className="marketing-voice__by">
          <b>{testimonial.name}</b>
          <span>{testimonial.role}</span>
        </figcaption>
      </section>

      <section className="marketing-cta">
        <Typography component="h2">Make the page worth the click.</Typography>
        <Button
          component={Link}
          href="/auth"
          size="large"
          variant="contained"
          endIcon={<ArrowForwardRounded aria-hidden="true" />}
        >
          Create your page
        </Button>
      </section>

      <footer className="marketing-footer">
        <BrandMark />
        <Typography>Clear links. Useful signals.</Typography>
        <div>
          <Link href="/cueful-vs-linktree">Cueful vs Linktree</Link>
          <Link href="/free-linktree-alternative">Switch from Linktree</Link>
          <Link href="/best-link-in-bio-tools">Compare tools</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/auth?mode=login">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}
