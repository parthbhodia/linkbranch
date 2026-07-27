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
import { BrandMark } from "@/components/brand-mark";

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
    description: "High-contrast and electric. A sharp home for musicians, streamers, and night owls.",
    badge: "Bold",
    previewClass: "template-preview--dark",
    accent: "#b9ff66",
  },
  {
    id: "soft-studio",
    number: "03",
    name: "Soft Studio",
    description: "Airy, calm, and image-forward. Designed for photographers, artists, and quiet brands.",
    badge: "New",
    previewClass: "template-preview--soft",
    accent: "#ffb7d0",
  },
];

function MiniProfile({ template }: { template: Template }) {
  return (
    <div className={`template-preview ${template.previewClass}`}>
      <div className="mini-profile__bar">
        <span>cueful</span>
        <span>•••</span>
      </div>
      <div className="mini-profile__avatar">PB</div>
      <div className="mini-profile__name">@yourname</div>
      <div className="mini-profile__bio">Making useful things for the web.</div>
      <div className="mini-profile__socials">
        <i />
        <i />
        <i />
      </div>
      <div className="mini-profile__links">
        <span>Latest project <b>↗</b></span>
        <span>Field notes <b>↗</b></span>
        <span>Creator stack <b>↗</b></span>
      </div>
    </div>
  );
}

export function TemplatePicker() {
  const [selectedId, setSelectedId] = useState<TemplateId>("field-notes");

  const selected = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? templates[0],
    [selectedId],
  );

  function selectTemplate(id: TemplateId) {
    setSelectedId(id);
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
            component={Link}
            href={`/onboarding?template=${selected.id}`}
            variant="contained"
            endIcon={<ArrowForwardRounded />}
          >
            Continue
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
            Preview uses sample content. Your links come next.
          </Typography>
        </aside>
      </div>
    </main>
  );
}
