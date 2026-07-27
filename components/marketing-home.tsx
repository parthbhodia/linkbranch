"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import AudiotrackRounded from "@mui/icons-material/AudiotrackRounded";
import BarChartRounded from "@mui/icons-material/BarChartRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import OndemandVideoRounded from "@mui/icons-material/OndemandVideoRounded";
import ShoppingBagOutlined from "@mui/icons-material/ShoppingBagOutlined";
import { Button, Chip, Typography } from "@mui/material";
import { exampleProfiles } from "@/lib/example-profiles";
import { UsernameClaim } from "@/components/username-claim";

const builderSteps = [
  {
    id: "profile",
    label: "Profile",
    title: "A clear first hello",
    detail: "Make the opening feel like you.",
  },
  {
    id: "referrals",
    label: "Referrals",
    title: "Offers with context",
    detail: "Codes, benefits, and expiry notes stay together.",
  },
  {
    id: "analytics",
    label: "Analytics",
    title: "Know what worked",
    detail: "See opens, copies, and the content earning attention.",
  },
] as const;

const blockTypes = [
  {
    icon: <EmailOutlined />,
    name: "Email signup",
    note: "Collect interest without sending visitors elsewhere.",
    color: "#dff36b",
  },
  {
    icon: <OndemandVideoRounded />,
    name: "Video",
    note: "Give launches, trailers, and explainers a visual first frame.",
    color: "#f4b7cf",
  },
  {
    icon: <AudiotrackRounded />,
    name: "Music",
    note: "Share a track or playlist without loading a heavy widget wall.",
    color: "#9ed6ff",
  },
  {
    icon: <ShoppingBagOutlined />,
    name: "Product",
    note: "Pair a useful image with price, context, and one clear action.",
    color: "#f3c66d",
  },
];

export function MarketingHome() {
  const [builderStep, setBuilderStep] =
    useState<(typeof builderSteps)[number]["id"]>("profile");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setBuilderStep((current) => {
        const index = builderSteps.findIndex((step) => step.id === current);
        return builderSteps[(index + 1) % builderSteps.length].id;
      });
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  const activeBuilderStep =
    builderSteps.find((step) => step.id === builderStep) ?? builderSteps[0];

  return (
    <main className="marketing-home">
      <nav className="marketing-nav" aria-label="Primary navigation">
        <Link className="brand marketing-nav__brand" href="/" aria-label="Linkbranch home">
          link<span>branch</span><i>.</i>
        </Link>
        <div className="marketing-nav__links">
          <Button component="a" href="#examples" color="inherit">
            Examples
          </Button>
          <Button component="a" href="#features" color="inherit">
            Features
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
            Start free
          </Button>
        </div>
      </nav>

      <section className="marketing-hero">
        <div className="marketing-hero__copy">
          <Chip
            className="marketing-kicker"
            label="YOUR BEST WORK · YOUR BEST OFFERS"
            variant="outlined"
          />
          <Typography component="h1">
            Your corner of
            <br />
            the internet,
            <br />
            <span>with direction.</span>
          </Typography>
          <Typography className="marketing-hero__body">
            Linkbranch turns your bio into a focused mini-site for the work,
            recommendations, and referral offers you actually want people to notice.
          </Typography>
          <UsernameClaim />
          <div className="marketing-hero__trust">
            <span><CheckRounded /> Free to start</span>
            <span><CheckRounded /> No credit card</span>
            <span><CheckRounded /> Publish in minutes</span>
          </div>
        </div>

        <div className={`builder-demo builder-demo--${builderStep}`} aria-label="Animated Linkbranch builder preview">
          <div className="builder-demo__editor">
            <div className="builder-demo__window">
              <i />
              <i />
              <i />
              <span>LINKBRANCH BUILDER</span>
            </div>
            <div className="builder-demo__tabs" role="tablist" aria-label="Builder preview">
              {builderSteps.map((step) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={builderStep === step.id}
                  className={builderStep === step.id ? "is-active" : ""}
                  onClick={() => setBuilderStep(step.id)}
                  key={step.id}
                >
                  {step.label}
                </button>
              ))}
            </div>
            <div className="builder-demo__controls" key={builderStep}>
              <p>{activeBuilderStep.title}</p>
              <span>{activeBuilderStep.detail}</span>
              <label>
                <small>{builderStep === "profile" ? "HEADLINE" : builderStep === "referrals" ? "OFFER" : "LAST 7 DAYS"}</small>
                <b>
                  {builderStep === "profile"
                    ? "I make useful things."
                    : builderStep === "referrals"
                      ? "$15 off your first ride"
                      : "324 interactions"}
                </b>
              </label>
              <label>
                <small>{builderStep === "profile" ? "INTRODUCTION" : builderStep === "referrals" ? "CODE" : "TOP ACTION"}</small>
                <b>
                  {builderStep === "profile"
                    ? "Projects, field notes, and tools."
                    : builderStep === "referrals"
                      ? "MOVE15"
                      : "Referral code copied"}
                </b>
              </label>
            </div>
          </div>

          <div className="builder-demo__stage">
            <span className="builder-demo__live">● LIVE PREVIEW</span>
            <div className="builder-phone">
              <div className="builder-phone__avatar">PB</div>
              <small>@avery-makes</small>
              <h2>Useful things,<br /><em>thoughtfully arranged.</em></h2>
              <p>Projects, field notes, favorite tools, and a few worthwhile perks.</p>
              <div className="builder-phone__offer">
                <span>NOTION / REFERRAL</span>
                <b>Templates for your next idea</b>
                <small>COPY · AVERY20</small>
              </div>
              <div className="builder-phone__link">
                <span><b>Latest side-project</b><small>An open-source experiment</small></span>
                <ArrowOutwardRounded />
              </div>
              {builderStep === "analytics" && (
                <div className="builder-phone__pulse">
                  <BarChartRounded />
                  <span><b>+28%</b><small>more offer copies</small></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-positioning" id="features">
        <div>
          <p className="section-label">NOT ANOTHER BUTTON WALL</p>
          <Typography component="h2">
            Guide attention.
            <br />
            Don’t just list things.
          </Typography>
        </div>
        <Typography>
          A visitor should understand who you are, what matters today, and where
          to go next. Linkbranch keeps every page curated, visual, and fast.
        </Typography>
      </section>

      <section className="marketing-examples" id="examples">
        <div className="marketing-examples__heading">
          <div>
            <p className="section-label">MADE FOR DIFFERENT KINDS OF USEFUL</p>
            <Typography component="h2">Three pages. Three intentions.</Typography>
          </div>
          <Typography>
            Start with a real structure, then make it yours.
          </Typography>
        </div>
        <div className="example-profile-grid">
          {exampleProfiles.map((example, index) => (
            <Link
              className={`example-profile example-profile--${example.template}`}
              href={`/u/${example.slug}`}
              key={example.slug}
            >
              <div className="example-profile__meta">
                <span>0{index + 1} / {example.role.toUpperCase()}</span>
                <ArrowOutwardRounded />
              </div>
              <div className="example-profile__phone">
                <i>{example.profile.initials}</i>
                <small>@{example.profile.username}</small>
                <b>{example.profile.headline}<em> {example.profile.headlineAccent}</em></b>
                <span />
                <span />
                <span />
              </div>
              <div>
                <Typography component="h3">{example.profile.displayName}</Typography>
                <Typography>{example.profile.bio}</Typography>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="marketing-referrals">
        <div className="marketing-referrals__copy">
          <p className="section-label">THE LINKBRANCH ADVANTAGE</p>
          <Typography component="h2">
            Referrals deserve
            <br />
            more than a URL.
          </Typography>
          <Typography>
            Show the benefit, code, destination, and status together. Then see
            whether visitors opened the offer or copied the code.
          </Typography>
          <ul>
            <li><CheckRounded /> Coupon copy tracking</li>
            <li><CheckRounded /> Offer-open analytics</li>
            <li><CheckRounded /> Clear provider and benefit</li>
            <li><CheckRounded /> Expiry-ready card structure</li>
          </ul>
        </div>
        <div className="referral-proof">
          <div className="referral-proof__top">
            <span>OFFER PERFORMANCE</span>
            <Chip label="LAST 7 DAYS" size="small" variant="outlined" />
          </div>
          <div className="referral-proof__stats">
            <div><small>OFFER OPENS</small><b>184</b><span>+18%</span></div>
            <div><small>CODE COPIES</small><b>67</b><span>+28%</span></div>
            <div><small>COPY RATE</small><b>36%</b><span>Strong</span></div>
          </div>
          <div className="referral-proof__chart" aria-label="Seven day referral activity example">
            {[32, 48, 39, 66, 58, 84, 72].map((height, index) => (
              <span key={index} style={{ "--bar-height": `${height}%` } as React.CSSProperties}>
                <i />
                <small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small>
              </span>
            ))}
          </div>
          <div className="referral-proof__offer">
            <LocalOfferOutlined />
            <span><b>Notion templates</b><small>31 code copies · top offer</small></span>
            <strong>AVERY20</strong>
          </div>
        </div>
      </section>

      <section className="marketing-blocks">
        <div className="marketing-blocks__heading">
          <p className="section-label">HIGH-VALUE BLOCKS, LOW-NOISE PAGES</p>
          <Typography component="h2">Context without the widget bloat.</Typography>
          <Typography>
            The next block set is deliberately small: enough to help visitors act,
            without turning the page into a slow dashboard.
          </Typography>
        </div>
        <div className="marketing-block-grid">
          {blockTypes.map((block) => (
            <article key={block.name} style={{ "--block-color": block.color } as React.CSSProperties}>
              <span>{block.icon}</span>
              <Typography component="h3">{block.name}</Typography>
              <Typography>{block.note}</Typography>
              <Chip label="PLANNED BLOCK" size="small" variant="outlined" />
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-how">
        <div>
          <p className="section-label">FROM NAME TO LIVE PAGE</p>
          <Typography component="h2">Three steps. No blank-canvas panic.</Typography>
        </div>
        <ol>
          <li><span>01</span><b>Claim your username</b><p>Reserve the address you will share everywhere.</p></li>
          <li><span>02</span><b>Choose a starting mood</b><p>Pick a template and add only what earns a place.</p></li>
          <li><span>03</span><b>Publish and learn</b><p>Share your page, then follow the interactions that matter.</p></li>
        </ol>
      </section>

      <section className="marketing-cta">
        <p className="section-label">YOUR CORNER STARTS HERE</p>
        <Typography component="h2">Claim the name. Shape the page.</Typography>
        <Typography>
          Start free and publish when the page feels like yours.
        </Typography>
        <UsernameClaim compact />
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
