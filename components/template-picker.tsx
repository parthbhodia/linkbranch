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

type TemplateId = "field-notes" | "after-dark" | "soft-studio";

type Template = {
  id: TemplateId;
  number: string;
  name: string;
  description: string;
  badge: string;
  previewClass: string;
  accent: string;
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
  },
];

function MiniProfile({ template }: { template: Template }) {
  const isMusic = template.id === "after-dark";
  return (
    <div className={`template-preview ${template.previewClass}`}>
      <div className="mini-profile__bar">
        <span>cueful</span>
        <span>•••</span>
      </div>
      <div className="mini-profile__avatar">PB</div>
      <div className="mini-profile__name">@yourname</div>
      <div className="mini-profile__bio">
        {isMusic ? "New single out everywhere." : "Making useful things for the web."}
      </div>
      <div className="mini-profile__socials">
        <i />
        <i />
        <i />
      </div>
      {isMusic ? (
        <div className="mini-profile__music" aria-hidden="true">
          <span className="mini-profile__music-dot" />
          <span>
            <b>Now playing</b>
            <small>Spotify embed</small>
          </span>
        </div>
      ) : null}
      <div className="mini-profile__links">
        <span>{isMusic ? "Tour tickets" : "Latest project"} <b>↗</b></span>
        <span>{isMusic ? "Merch drop" : "Field notes"} <b>↗</b></span>
        <span>{isMusic ? "Mailing list" : "Creator stack"} <b>↗</b></span>
      </div>
    </div>
  );
}

export function TemplatePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("template");
  const initialId =
    requested === "after-dark" ||
    requested === "soft-studio" ||
    requested === "field-notes"
      ? requested
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
