"use client";

import Link from "next/link";
import AnalyticsOutlined from "@mui/icons-material/AnalyticsOutlined";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import GitHub from "@mui/icons-material/GitHub";
import Instagram from "@mui/icons-material/Instagram";
import LinkedIn from "@mui/icons-material/LinkedIn";
import PaletteOutlined from "@mui/icons-material/PaletteOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { Box, Button, Chip, IconButton, Typography } from "@mui/material";

const productNotes = [
  {
    number: "01",
    icon: <PaletteOutlined />,
    title: "A page with a point of view",
    body: "Choose a distinct template, shape your introduction, and keep the page unmistakably yours.",
  },
  {
    number: "02",
    icon: <ContentCopyRounded />,
    title: "Referrals belong here",
    body: "Give codes and offers proper space instead of burying them inside another generic link button.",
  },
  {
    number: "03",
    icon: <AnalyticsOutlined />,
    title: "Signals you can use",
    body: "See which links open, which offers get explored, and which codes your visitors copy.",
  },
];

const templates = [
  {
    id: "field-notes",
    name: "Field Notes",
    note: "Warm, editorial, considered",
  },
  {
    id: "after-dark",
    name: "After Dark",
    note: "High contrast, quiet confidence",
  },
  {
    id: "soft-studio",
    name: "Soft Studio",
    note: "Playful, polished, expressive",
  },
];

export function MarketingHome() {
  return (
    <main className="marketing-home">
      <nav className="marketing-nav" aria-label="Primary navigation">
        <Link className="brand marketing-nav__brand" href="/" aria-label="Linkbranch home">
          link<span>branch</span><i>.</i>
        </Link>
        <div className="marketing-nav__links">
          <Button component={Link} href="/templates" color="inherit">
            Templates
          </Button>
          <Button component={Link} href="/auth?mode=login" color="inherit">
            Sign in
          </Button>
          <Button
            component={Link}
            href="/auth"
            variant="contained"
            endIcon={<ArrowForwardRounded />}
          >
            Start your page
          </Button>
        </div>
      </nav>

      <section className="marketing-hero">
        <div className="marketing-hero__copy">
          <Chip
            className="marketing-kicker"
            label="LINKS · REFERRALS · ANALYTICS"
            variant="outlined"
          />
          <Typography component="h1">
            One small page.
            <br />
            <span>A much better</span>
            <br />
            first impression.
          </Typography>
          <Typography className="marketing-hero__body">
            Linkbranch gives creators a focused home for the work, recommendations,
            and referral offers they actually want people to notice.
          </Typography>
          <div className="marketing-hero__actions">
            <Button
              component={Link}
              href="/auth"
              size="large"
              variant="contained"
              endIcon={<ArrowForwardRounded />}
            >
              Create your Linkbranch
            </Button>
            <Button
              component={Link}
              href="/demo"
              size="large"
              variant="outlined"
              endIcon={<ArrowOutwardRounded />}
            >
              View a live profile
            </Button>
          </div>
          <Typography className="marketing-fine-print">
            Start free. Publish when it feels right.
          </Typography>
        </div>

        <div className="marketing-showcase" aria-label="Example Linkbranch profile">
          <div className="marketing-showcase__orbit marketing-showcase__orbit--one" />
          <div className="marketing-showcase__orbit marketing-showcase__orbit--two" />
          <article className="marketing-profile-card">
            <div className="marketing-profile-card__top">
              <span>linkbranch.com/u/parth</span>
              <i />
            </div>
            <div className="marketing-profile-card__avatar">PB</div>
            <Typography className="marketing-profile-card__handle">@parth</Typography>
            <Typography component="h2">Useful things, thoughtfully arranged.</Typography>
            <Typography className="marketing-profile-card__bio">
              Projects, field notes, favorite tools, and a few worthwhile perks.
            </Typography>
            <div className="marketing-profile-card__socials" aria-label="Example social links">
              <IconButton aria-label="Instagram preview" tabIndex={-1}>
                <Instagram />
              </IconButton>
              <IconButton aria-label="GitHub preview" tabIndex={-1}>
                <GitHub />
              </IconButton>
              <IconButton aria-label="LinkedIn preview" tabIndex={-1}>
                <LinkedIn />
              </IconButton>
            </div>
            <div className="marketing-profile-card__search">
              <SearchRounded />
              <span>Search links and offers…</span>
            </div>
            <div className="marketing-profile-card__label">
              <span>PERKS & REFERRALS</span>
              <span>SWIPE →</span>
            </div>
            <div className="marketing-profile-card__perks">
              <div>
                <b>Notion</b>
                <span>Templates for your next idea</span>
                <small>COPY CODE</small>
              </div>
              <div>
                <b>Figma</b>
                <span>A better way to start designing</span>
                <small>OPEN OFFER</small>
              </div>
            </div>
            <div className="marketing-profile-card__link">
              <span>
                <b>Latest side-project</b>
                <small>An open-source experiment</small>
              </span>
              <ArrowOutwardRounded />
            </div>
          </article>
        </div>
      </section>

      <section className="marketing-proof" aria-label="Product highlights">
        <span>YOUR DOMAIN</span>
        <i />
        <span>THREE DISTINCT TEMPLATES</span>
        <i />
        <span>REFERRALS BUILT IN</span>
        <i />
        <span>SUPABASE-POWERED</span>
      </section>

      <section className="marketing-features">
        <div className="marketing-section-copy">
          <p className="section-label">WHY LINKBRANCH</p>
          <Typography component="h2">
            More useful than
            <br />
            a wall of buttons.
          </Typography>
          <Typography color="text.secondary">
            Every part of the page has a job: introduce you, guide attention,
            surface good offers, and learn what resonates.
          </Typography>
        </div>
        <div className="marketing-feature-list">
          {productNotes.map((note) => (
            <article className="marketing-feature" key={note.number}>
              <span className="marketing-feature__number">{note.number}</span>
              <Box className="marketing-feature__icon">{note.icon}</Box>
              <Typography component="h3">{note.title}</Typography>
              <Typography color="text.secondary">{note.body}</Typography>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-templates">
        <div className="marketing-templates__heading">
          <div>
            <p className="section-label">START WITH A MOOD</p>
            <Typography component="h2">Three templates. No blank canvas.</Typography>
          </div>
          <Button component={Link} href="/templates" endIcon={<ArrowForwardRounded />}>
            Explore templates
          </Button>
        </div>
        <div className="marketing-template-grid">
          {templates.map((template, index) => (
            <Link
              className={`marketing-template marketing-template--${template.id}`}
              href={`/onboarding?template=${template.id}`}
              key={template.id}
            >
              <span className="marketing-template__index">
                0{index + 1}
              </span>
              <div className="marketing-template__portrait">
                <i />
                <b>Aa</b>
                <span />
                <span />
                <span />
              </div>
              <div>
                <Typography component="h3">{template.name}</Typography>
                <Typography>{template.note}</Typography>
              </div>
              <ArrowOutwardRounded />
            </Link>
          ))}
        </div>
      </section>

      <section className="marketing-cta">
        <p className="section-label">YOUR CORNER OF THE INTERNET</p>
        <Typography component="h2">Make every click feel intentional.</Typography>
        <Typography>
          Build a profile people understand—and remember—in under ten minutes.
        </Typography>
        <Button
          component={Link}
          href="/auth"
          size="large"
          variant="contained"
          endIcon={<ArrowForwardRounded />}
        >
          Start building
        </Button>
      </section>

      <footer className="marketing-footer">
        <Link className="brand" href="/">
          link<span>branch</span><i>.</i>
        </Link>
        <Typography>For creators who prefer clarity over clutter.</Typography>
        <div>
          <Link href="/templates">Templates</Link>
          <Link href="/auth?mode=login">Sign in</Link>
        </div>
      </footer>
    </main>
  );
}
