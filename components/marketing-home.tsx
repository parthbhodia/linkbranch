"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import BarChartRounded from "@mui/icons-material/BarChartRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import { Button, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { BrandMark } from "@/components/brand-mark";
import { ImportStarter } from "@/components/import-starter";
import { UsernameClaim } from "@/components/username-claim";
import { exampleProfiles } from "@/lib/example-profiles";
import { publicProfilePath } from "@/lib/brand";
import { captureReferralFromLocation } from "@/lib/referrals";
import { createClient } from "@/lib/supabase/client";

type BuilderStep = "profile" | "links" | "referrals" | "analytics";

const homepageTemplates = [
  {
    href: "/templates/link-in-bio-for-musicians",
    label: "Musicians",
    title: "Release-first page",
    note: "Spotify embed, tour dates, merch.",
    template: "after-dark",
  },
  {
    href: "/templates/spotify-embed-link-in-bio",
    label: "Spotify embed",
    title: "Put the player on the page",
    note: "Paste a track, album, or playlist URL.",
    template: "after-dark",
  },
  {
    href: "/templates/link-in-bio-for-podcasters",
    label: "Podcasters",
    title: "One link for every episode",
    note: "Episode player, guests, subscribe.",
    template: "field-notes",
  },
  {
    href: "/templates/referral-links-for-creators",
    label: "Referral creators",
    title: "Offers that stay clear",
    note: "Codes, disclosures, copy actions.",
    template: "field-notes",
  },
  {
    href: "/templates/portfolio-link-page-for-freelancers",
    label: "Freelancers",
    title: "Portfolio that books work",
    note: "Selected work, services, availability.",
    template: "soft-studio",
  },
];

const builderTabs: Array<{ id: BuilderStep; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "links", label: "Links" },
  { id: "referrals", label: "Referrals" },
  { id: "analytics", label: "Analytics" },
];

const demoLinks = [
  {
    id: "project",
    title: "Latest side-project",
    note: "A small open-source experiment",
  },
  {
    id: "notes",
    title: "Field notes",
    note: "Practical ideas from recent work",
  },
  {
    id: "tools",
    title: "Favorite tools",
    note: "A short, maintained collection",
  },
];

export function MarketingHome() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [builderStep, setBuilderStep] = useState<BuilderStep>("profile");
  const [importOpen, setImportOpen] = useState(false);

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
  const [demoName, setDemoName] = useState("Avery");
  const [demoHeadline, setDemoHeadline] = useState(
    "Useful things, thoughtfully arranged.",
  );
  const [selectedLink, setSelectedLink] = useState(demoLinks[0].id);
  const [demoOffer, setDemoOffer] = useState("Templates for your next idea");
  const [demoCode, setDemoCode] = useState("AVERY20");
  const [linkOpens, setLinkOpens] = useState(184);
  const [codeCopies, setCodeCopies] = useState(67);
  const [copied, setCopied] = useState(false);
  const [demoStatus, setDemoStatus] = useState("Demo ready");
  const [activeExample, setActiveExample] = useState(0);
  const examplesRailRef = useRef<HTMLDivElement>(null);

  const initials = useMemo(
    () =>
      demoName
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "CF",
    [demoName],
  );
  const headlineWords = demoHeadline.trim().split(/\s+/);
  const accentWord = headlineWords.pop() || "arranged.";
  const headlineLead = headlineWords.join(" ");
  const copyRate = Math.round((codeCopies / Math.max(1, linkOpens)) * 100);

  function recordLinkOpen(linkId: string) {
    setSelectedLink(linkId);
    setLinkOpens((count) => count + 1);
    setDemoStatus("Link open recorded");
  }

  async function copyDemoCode() {
    try {
      await navigator.clipboard.writeText(demoCode);
    } catch {
      // The demo still records the intent when clipboard access is unavailable.
    }
    setCodeCopies((count) => count + 1);
    setCopied(true);
    setDemoStatus(`${demoCode || "Referral"} copied`);
    window.setTimeout(() => setCopied(false), 1600);
  }

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
          <Button component={Link} href="#templates" color="inherit">
            Templates
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
            <span><CheckRounded aria-hidden="true" /> Free username</span>
            <span><CheckRounded aria-hidden="true" /> No forced branding</span>
          </div>
        </div>

        <div
          className={`builder-demo builder-demo--${builderStep}`}
          aria-label="Interactive Cueful builder demo"
        >
          <div className="builder-demo__editor">
            <div className="builder-demo__window">
              <i />
              <i />
              <i />
              <span>LIVE BUILDER</span>
            </div>

            <div className="builder-demo__tabs" role="tablist" aria-label="Demo editor sections">
              {builderTabs.map((tab) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={builderStep === tab.id}
                  className={builderStep === tab.id ? "is-active" : ""}
                  onClick={() => setBuilderStep(tab.id)}
                  key={tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="builder-demo__controls" key={builderStep}>
              {builderStep === "profile" && (
                <>
                  <div className="builder-demo__intro">
                    <p>Edit the introduction</p>
                    <span>The preview updates as you type.</span>
                  </div>
                  <label>
                    <small>DISPLAY NAME</small>
                    <input
                      name="demo-display-name"
                      value={demoName}
                      onChange={(event) => setDemoName(event.target.value)}
                      maxLength={24}
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    <small>HEADLINE</small>
                    <input
                      name="demo-headline"
                      value={demoHeadline}
                      onChange={(event) => setDemoHeadline(event.target.value)}
                      maxLength={64}
                      autoComplete="off"
                    />
                  </label>
                </>
              )}

              {builderStep === "links" && (
                <>
                  <div className="builder-demo__intro">
                    <p>Choose the spotlight</p>
                    <span>One clear priority beats a crowded list.</span>
                  </div>
                  <div className="builder-demo__choice-list">
                    {demoLinks.map((link) => (
                      <button
                        type="button"
                        className={selectedLink === link.id ? "is-selected" : ""}
                        onClick={() => setSelectedLink(link.id)}
                        key={link.id}
                      >
                        <span><b>{link.title}</b><small>{link.note}</small></span>
                        {selectedLink === link.id && <CheckRounded aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {builderStep === "referrals" && (
                <>
                  <div className="builder-demo__intro">
                    <p>Give the offer context</p>
                    <span>Benefit and code stay together.</span>
                  </div>
                  <label>
                    <small>OFFER</small>
                    <input
                      name="demo-offer"
                      value={demoOffer}
                      onChange={(event) => setDemoOffer(event.target.value)}
                      maxLength={56}
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    <small>CODE</small>
                    <input
                      name="demo-code"
                      value={demoCode}
                      onChange={(event) =>
                        setDemoCode(event.target.value.toUpperCase().replace(/\s/g, ""))
                      }
                      maxLength={20}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </label>
                </>
              )}

              {builderStep === "analytics" && (
                <>
                  <div className="builder-demo__intro">
                    <p>See the useful signals</p>
                    <span>Try a link or copy the code in the preview.</span>
                  </div>
                  <div className="builder-demo__metrics">
                    <div><small>LINK OPENS</small><b>{linkOpens}</b></div>
                    <div><small>CODE COPIES</small><b>{codeCopies}</b></div>
                    <div><small>COPY RATE</small><b>{copyRate}%</b></div>
                  </div>
                  <div className="builder-demo__mini-chart" aria-label="Demo activity chart">
                    {[38, 55, 46, 72, 64, 88, 78].map((height, index) => (
                      <i
                        key={index}
                        style={{ "--demo-height": `${height}%` } as React.CSSProperties}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="builder-demo__stage">
            <span className="builder-demo__live">● LIVE PREVIEW</span>
            <article className="builder-phone" aria-label="Public profile preview">
              <div className="builder-phone__avatar">{initials}</div>
              <small>@avery-makes</small>
              <h2>
                {headlineLead || "Useful things"}{" "}
                <em>{accentWord}</em>
              </h2>
              <p>{demoName || "Your name"} shares a small, useful collection.</p>
              <div className="builder-phone__socials" aria-label="Social profile preview">
                <i>ig</i><i>yt</i><i>gh</i>
              </div>
              <div className="builder-phone__offer">
                <span>NOTION / REFERRAL</span>
                <b>{demoOffer || "A useful referral offer"}</b>
                <button type="button" onClick={copyDemoCode}>
                  <ContentCopyRounded aria-hidden="true" />
                  {copied ? "Copied" : `Copy · ${demoCode || "CODE"}`}
                </button>
              </div>
              <div className="builder-phone__links">
                {demoLinks.slice(0, 2).map((link) => (
                  <button
                    type="button"
                    className={selectedLink === link.id ? "is-spotlight" : ""}
                    onClick={() => recordLinkOpen(link.id)}
                    key={link.id}
                  >
                    <span><b>{link.title}</b><small>{link.note}</small></span>
                    <ArrowOutwardRounded aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="builder-phone__signals">
                <span><b>{linkOpens}</b><small>opens</small></span>
                <span><b>{codeCopies}</b><small>copies</small></span>
                <BarChartRounded aria-hidden="true" />
              </div>
              <span className="sr-only" aria-live="polite">{demoStatus}</span>
            </article>
          </div>
        </div>
      </section>

      <section className="marketing-templates" id="templates">
        <div className="marketing-templates__heading">
          <div>
            <p className="section-label">TEMPLATES</p>
            <Typography component="h2">Start with a finished layout.</Typography>
          </div>
          <Typography>
            Musicians, Spotify embeds, podcasters, referral pages, and freelancer portfolios.
          </Typography>
        </div>
        <div className="marketing-templates__grid">
          {homepageTemplates.map((item) => (
            <Link
              className={`marketing-template-card marketing-template-card--${item.template}`}
              href={item.href}
              key={item.href}
            >
              <span>{item.label}</span>
              <Typography component="h3">{item.title}</Typography>
              <Typography>{item.note}</Typography>
              <em>
                Open template <ArrowOutwardRounded fontSize="inherit" aria-hidden="true" />
              </em>
            </Link>
          ))}
        </div>
        <div className="marketing-templates__footer">
          <Button
            component={Link}
            href="/templates"
            variant="outlined"
            endIcon={<ArrowForwardRounded aria-hidden="true" />}
          >
            Browse all templates
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
                  <i>{example.profile.initials}</i>
                  <small>@{example.profile.username}</small>
                  <b>
                    {example.profile.headline}
                    <em> {example.profile.headlineAccent}</em>
                  </b>
                  {example.mediaEmbeds?.[0] ? (
                    <span className="example-profile__music">
                      <strong>▶ {example.mediaEmbeds[0].title}</strong>
                      <em>{example.mediaEmbeds[0].provider.replace("_", " ")} embed</em>
                    </span>
                  ) : null}
                  {example.profile.links
                    .slice(0, example.mediaEmbeds?.length ? 1 : 2)
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
                            isBooking ? " example-profile__link--booking" : ""
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
                    })}
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
          <Link href="/free-linktree-alternative">Switch from Linktree</Link>
          <Link href="/best-link-in-bio-tools">Compare tools</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/auth?mode=login">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}
