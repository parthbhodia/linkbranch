"use client";

import { useMemo, useState } from "react";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import PaletteOutlined from "@mui/icons-material/PaletteOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Radio,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { readImportedProfileDraft } from "@/lib/import-draft";

type TemplateId =
  | "field-notes"
  | "after-dark"
  | "soft-studio"
  | "signal-deck"
  | "press-sheet"
  | "golden-hour"
  | "broadsheet"
  | "tide-pool";

type Template = {
  id: TemplateId;
  number: string;
  name: string;
  description: string;
  badge: string;
  previewClass: string;
  accent: string;
  /** Which sample body the preview draws, so the cards stop looking alike. */
  shape: "links" | "music" | "shop" | "signals" | "index" | "column";
};

const templates: Template[] = [
  {
    id: "field-notes",
    number: "01",
    name: "Field Notes",
    description: "Warm, editorial, and personal. Made for builders who want their work to feel hand-picked.",
    badge: "Most popular",
    previewClass: "template-preview--field",
    accent: "#c9ef69",
    shape: "links",
  },
  {
    id: "after-dark",
    number: "02",
    name: "After Dark",
    description:
      "High-contrast with room for Spotify embeds. Built for musicians, podcasters, and night owls.",
    badge: "Music embeds",
    previewClass: "template-preview--dark",
    accent: "#b9ff66",
    shape: "music",
  },
  {
    id: "soft-studio",
    number: "03",
    name: "Soft Studio",
    description:
      "Airy and image-forward. Made for shops, photographers, artists, and quiet brands.",
    badge: "Shop ready",
    previewClass: "template-preview--soft",
    accent: "#ffb7d0",
    shape: "shop",
  },
  {
    id: "signal-deck",
    number: "04",
    name: "Signal Deck",
    description:
      "Dark charcoal with lime signals, skill tags, and icon-forward links. Built for builders and operators.",
    badge: "New",
    previewClass: "template-preview--signal",
    accent: "#b9ff66",
    shape: "signals",
  },
  {
    id: "press-sheet",
    number: "05",
    name: "Press Sheet",
    description:
      "Newsprint and red ink on graph paper. Square corners, monospaced, nothing decorative. For writers and zines.",
    badge: "Brutalist",
    previewClass: "template-preview--press",
    accent: "#d5361f",
    shape: "index",
  },
  {
    id: "golden-hour",
    number: "06",
    name: "Golden Hour",
    description:
      "Warm sunset wash with rounded type and pill buttons. Made for lifestyle, travel, and food creators.",
    badge: "Warm",
    previewClass: "template-preview--golden",
    accent: "#e2582a",
    shape: "links",
  },
  {
    id: "broadsheet",
    number: "07",
    name: "Broadsheet",
    description:
      "Serif headlines on paper stock with outlined buttons. For essayists, researchers, and newsletters.",
    badge: "Editorial",
    previewClass: "template-preview--broadsheet",
    accent: "#2f5d3f",
    shape: "column",
  },
  {
    id: "tide-pool",
    number: "08",
    name: "Tide Pool",
    description:
      "Deep teal with frosted glass cards over a lagoon wash. For studios and anyone wanting a darker calm.",
    badge: "Glass",
    previewClass: "template-preview--tide",
    accent: "#4fd3c4",
    shape: "shop",
  },
];

function MiniProfile({ template }: { template: Template }) {
  const { shape } = template;
  const bio =
    shape === "music"
      ? "New single out everywhere."
      : shape === "shop"
        ? "Small batch, made to order."
        : shape === "column"
          ? "Essays on how things get built."
          : shape === "index"
            ? "Notes, filed and dated."
            : "Making useful things for the web.";

  return (
    <div className={`template-preview ${template.previewClass}`}>
      <div className="mini-profile__bar">
        <span>cueful</span>
        <span>•••</span>
      </div>
      <div className="mini-profile__avatar">PB</div>
      <div className="mini-profile__name">@yourname</div>
      <div className="mini-profile__bio">{bio}</div>

      {shape === "signals" ? (
        <div className="mini-profile__tags" aria-hidden="true">
          <i>AWS</i>
          <i>DevOps</i>
          <i>Design</i>
        </div>
      ) : (
        <div className="mini-profile__socials">
          <i />
          <i />
          <i />
        </div>
      )}

      {shape === "music" ? (
        <div className="mini-profile__music" aria-hidden="true">
          <span className="mini-profile__music-dot" />
          <span>
            <b>Now playing</b>
            <small>Spotify embed</small>
          </span>
        </div>
      ) : null}

      {shape === "shop" ? (
        <div className="mini-profile__shop" aria-hidden="true">
          <span>
            <i />
            <b>Speckled mug</b>
            <small>USD 48</small>
          </span>
          <span>
            <i />
            <b>One-off vase</b>
            <small>USD 120</small>
          </span>
        </div>
      ) : null}

      {shape === "column" ? (
        <div className="mini-profile__column" aria-hidden="true">
          <b>The cost of a rewrite</b>
          <small>Issue 14 · 8 min</small>
          <b>Notes on shipping slowly</b>
          <small>Issue 13 · 5 min</small>
        </div>
      ) : null}

      {shape === "index" ? (
        <div className="mini-profile__index" aria-hidden="true">
          <span>
            <em>01</em> Field notes
          </span>
          <span>
            <em>02</em> Archive
          </span>
          <span>
            <em>03</em> Contact
          </span>
        </div>
      ) : null}

      {shape === "links" || shape === "music" || shape === "signals" ? (
        <div className="mini-profile__links">
          <span>
            {shape === "music" ? "Tour tickets" : "Latest project"} <b>↗</b>
          </span>
          <span>
            {shape === "music" ? "Merch drop" : "Field notes"} <b>↗</b>
          </span>
          {shape !== "signals" && (
            <span>
              {shape === "music" ? "Mailing list" : "Creator stack"} <b>↗</b>
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function TemplatePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("template");
  const initialId = templates.some((item) => item.id === requested)
    ? (requested as TemplateId)
    : "field-notes";
  const [selectedId, setSelectedId] = useState<TemplateId>(initialId);
  const isImportFlow = searchParams.get("import") === "1";

  const selected = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? templates[0],
    [selectedId],
  );

  function selectTemplate(id: TemplateId) {
    setSelectedId(id);
  }

  function continueSetup() {
    if (!isImportFlow) {
      router.push(`/onboarding?template=${selected.id}`);
      return;
    }

    const draft = readImportedProfileDraft();
    const params = new URLSearchParams({
      mode: "signup",
      import: "1",
      template: selected.id,
    });
    if (draft?.suggestedUsername) {
      params.set("username", draft.suggestedUsername);
    }
    if (draft?.displayName) {
      params.set("display_name", draft.displayName);
    }
    router.push(`/auth?${params.toString()}`);
  }

  return (
    <main className="template-shell">
      <header className="template-topbar">
        <BrandMark />
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary" className="template-step-copy">
            PROFILE SETUP
          </Typography>
          <Chip label="Step 1 of 3" size="small" variant="outlined" />
        </Stack>
      </header>

      <section className="template-intro">
        <Box>
          <p className="section-label">STEP 1 OF 3</p>
          <Typography component="h1" variant="h2">
            Choose a template
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 570 }}>
            Pick a starting layout. Colors and typography can be changed later.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} className="template-actions">
          <Button component={Link} href="/" startIcon={<ArrowBackRounded />} color="inherit">
            Back
          </Button>
          <Button
            onClick={continueSetup}
            variant="contained"
            endIcon={<ArrowForwardRounded />}
          >
            {isImportFlow ? "Use this design" : "Continue"}
          </Button>
        </Stack>
      </section>

      <div className="template-workspace">
        <section className="template-options" aria-label="Available profile templates">
          <div className="template-options__heading">
            <Typography component="h2" variant="h3">Templates</Typography>
            <Typography variant="caption" color="text.secondary">Select to preview</Typography>
          </div>
          <div className="template-card-rail">
            {templates.map((template) => {
              const isSelected = template.id === selectedId;
              return (
                <button
                  className={`template-card${isSelected ? " is-selected" : ""}`}
                  key={template.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectTemplate(template.id)}
                  style={{ "--template-accent": template.accent } as React.CSSProperties}
                >
                  <div className="template-card__top">
                    <span>{template.number}</span>
                    <Chip
                      label={template.badge}
                      size="small"
                      color={isSelected ? "primary" : "default"}
                    />
                  </div>
                  <div className="template-card__mini">
                    <MiniProfile template={template} />
                  </div>
                  <div className="template-card__copy">
                    <span>
                      <Typography component="strong" variant="h3">{template.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {template.description}
                      </Typography>
                    </span>
                    <Radio
                      checked={isSelected}
                      value={template.id}
                      inputProps={{ "aria-label": `Select ${template.name}` }}
                      tabIndex={-1}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="live-preview-panel" aria-label={`${selected.name} live preview`}>
          <div className="live-preview-panel__top">
            <Stack direction="row" spacing={1} alignItems="center">
              <PaletteOutlined fontSize="small" />
              <div>
                <Typography variant="h3">Live preview</Typography>
                <Typography variant="caption" color="text.secondary">{selected.name}</Typography>
              </div>
            </Stack>
            <Tooltip title="Open full preview" arrow>
              <IconButton aria-label="Open full preview">
                <VisibilityOutlined />
              </IconButton>
            </Tooltip>
          </div>
          <div className="phone-frame">
            <div className="phone-frame__speaker" />
            <MiniProfile template={selected} />
          </div>
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {isImportFlow
              ? "Your imported profile and links will be applied after signup."
              : "Preview uses sample content. Your links come next."}
          </Typography>
        </aside>
      </div>

      <nav className="template-use-case-links" aria-label="Template guides by use case">
        <Typography variant="caption" color="text.secondary">
          Explore a complete example
        </Typography>
        <Link href="/templates/link-in-bio-for-musicians">Musicians</Link>
        <Link href="/templates/spotify-embed-link-in-bio">Spotify embed</Link>
        <Link href="/templates/link-in-bio-shop">Shop</Link>
        <Link href="/templates/link-in-bio-for-podcasters">Podcasters</Link>
        <Link href="/templates/referral-links-for-creators">Referral creators</Link>
        <Link href="/templates/portfolio-link-page-for-freelancers">Freelancers</Link>
      </nav>
    </main>
  );
}
