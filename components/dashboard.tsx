"use client";

import { useMemo, useState } from "react";
import AnalyticsOutlined from "@mui/icons-material/AnalyticsOutlined";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ColorLensOutlined from "@mui/icons-material/ColorLensOutlined";
import InsertLinkRounded from "@mui/icons-material/InsertLinkRounded";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type DashboardProfile = {
  id: string;
  username: string;
  display_name: string;
  greeting: string;
  headline: string;
  headline_accent: string;
  bio: string;
  location: string;
  show_location: boolean;
  template: string;
  avatar_path: string | null;
  is_published: boolean;
  onboarding_completed: boolean;
};

export type DashboardLink = {
  id: number;
  title: string;
  subtitle: string;
  url: string;
  position: number;
  is_active: boolean;
  is_featured: boolean;
};

export type DashboardReferral = {
  id: number;
  provider: string;
  offer: string;
  url: string;
  code: string | null;
  color: string;
  position: number;
  is_active: boolean;
};

type WorkspaceSection =
  | "profile"
  | "content"
  | "appearance"
  | "analytics"
  | "account";

const workspaceSections: Array<{
  id: WorkspaceSection;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "profile", label: "Profile", icon: <PersonOutlineRounded /> },
  { id: "content", label: "Links & referrals", icon: <InsertLinkRounded /> },
  { id: "appearance", label: "Appearance", icon: <ColorLensOutlined /> },
  { id: "analytics", label: "Analytics", icon: <AnalyticsOutlined /> },
  { id: "account", label: "Account", icon: <SettingsOutlined /> },
];

const sectionCopy: Record<
  WorkspaceSection,
  { eyebrow: string; title: string; body: string }
> = {
  profile: {
    eyebrow: "PROFILE",
    title: "Tell people who you are",
    body: "Edit the introduction that appears at the top of your public page.",
  },
  content: {
    eyebrow: "CONTENT",
    title: "Arrange every useful branch",
    body: "Keep projects, resources, and referral offers in one clear list.",
  },
  appearance: {
    eyebrow: "DESIGN",
    title: "Choose how your page feels",
    body: "Switch templates without changing any of your content.",
  },
  analytics: {
    eyebrow: "ACTIVITY",
    title: "See what people explore",
    body: "A simple view of the content already on your page and its activity.",
  },
  account: {
    eyebrow: "ACCOUNT",
    title: "Publishing and sign-in",
    body: "Control page visibility and review the email attached to this account.",
  },
};

const templateOptions = [
  {
    id: "field-notes",
    name: "Field Notes",
    color: "#d9f36a",
    accent: "#b74825",
  },
  {
    id: "after-dark",
    name: "After Dark",
    color: "#171816",
    accent: "#e9ff78",
  },
  {
    id: "soft-studio",
    name: "Soft Studio",
    color: "#f1d9ee",
    accent: "#9b3c78",
  },
];

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <Paper className="workspace-stat" variant="outlined">
      <Typography className="section-label">{label}</Typography>
      <Typography variant="h2">{value}</Typography>
      <Typography variant="body2" color="text.secondary">
        {note}
      </Typography>
    </Paper>
  );
}

export function Dashboard({
  profile,
  email,
  links,
  referrals,
  interactionCount,
}: {
  profile: DashboardProfile;
  email: string;
  links: DashboardLink[];
  referrals: DashboardReferral[];
  interactionCount: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(profile);
  const [section, setSection] = useState<WorkspaceSection>("profile");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  const activeLinks = useMemo(
    () => links.filter((item) => item.is_active),
    [links],
  );
  const activeReferrals = useMemo(
    () => referrals.filter((item) => item.is_active),
    [referrals],
  );
  const sectionDetails = sectionCopy[section];
  const initials =
    draft.display_name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LB";

  function update<K extends keyof DashboardProfile>(
    field: K,
    value: DashboardProfile[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        username: draft.username.trim().toLowerCase(),
        display_name: draft.display_name.trim(),
        greeting: draft.greeting.trim(),
        headline: draft.headline.trim(),
        headline_accent: draft.headline_accent.trim(),
        bio: draft.bio.trim(),
        location: draft.location.trim(),
        show_location: draft.show_location,
        template: draft.template,
        is_published: draft.is_published,
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      setNotice({ severity: "error", message: error.message });
      return;
    }

    setNotice({ severity: "success", message: "Your page has been updated." });
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <main className="workspace-shell">
      <aside className="workspace-rail" aria-label="Creator workspace">
        <Link className="workspace-rail__brand" href="/" aria-label="Linkbranch home">
          lb<span>.</span>
        </Link>
        <Avatar className="workspace-rail__avatar">{initials}</Avatar>
        <nav className="workspace-rail__nav" aria-label="Editor sections">
          {workspaceSections.map((item) => (
            <Tooltip title={item.label} placement="right" arrow key={item.id}>
              <IconButton
                className={section === item.id ? "is-active" : ""}
                aria-label={item.label}
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => setSection(item.id)}
              >
                {item.icon}
              </IconButton>
            </Tooltip>
          ))}
        </nav>
        <Tooltip title="Sign out" placement="right" arrow>
          <IconButton
            className="workspace-rail__logout"
            aria-label="Sign out"
            onClick={signOut}
          >
            <LogoutRounded />
          </IconButton>
        </Tooltip>
      </aside>

      <section className="workspace-editor">
        <header className="workspace-editor__topbar">
          <Box>
            <Typography className="section-label">
              {sectionDetails.eyebrow}
            </Typography>
            <Typography component="h1" variant="h3">
              {sectionDetails.title}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {draft.is_published && (
              <Tooltip title="Open public page" arrow>
                <IconButton
                  component={Link}
                  href={`/u/${draft.username}`}
                  target="_blank"
                  aria-label="Open public page"
                >
                  <ArrowOutwardRounded />
                </IconButton>
              </Tooltip>
            )}
            <Button
              variant="contained"
              onClick={saveProfile}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={17} /> : undefined}
            >
              {saving ? "Saving" : "Update"}
            </Button>
          </Stack>
        </header>

        <div className="workspace-editor__scroll">
          <Typography className="workspace-editor__intro" color="text.secondary">
            {sectionDetails.body}
          </Typography>

          {section === "profile" && (
            <Stack className="workspace-panel" spacing={2}>
              <Box className="workspace-profile-row">
                <Avatar>{initials}</Avatar>
                <Box>
                  <Typography variant="h3">{draft.display_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{draft.username}
                  </Typography>
                </Box>
                <Button variant="outlined" disabled>
                  Upload photo
                </Button>
              </Box>
              <TextField
                label="Display name"
                value={draft.display_name}
                onChange={(event) => update("display_name", event.target.value)}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Username"
                value={draft.username}
                onChange={(event) =>
                  update(
                    "username",
                    event.target.value.replace(/\s/g, "").toLowerCase(),
                  )
                }
                required
                helperText={`Public URL: /u/${draft.username || "username"}`}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <div className="workspace-form-pair">
                <TextField
                  label="Greeting"
                  value={draft.greeting}
                  onChange={(event) => update("greeting", event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Headline"
                  value={draft.headline}
                  onChange={(event) => update("headline", event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </div>
              <TextField
                label="Accent text"
                value={draft.headline_accent}
                onChange={(event) => update("headline_accent", event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Supporting paragraph"
                value={draft.bio}
                onChange={(event) => update("bio", event.target.value)}
                multiline
                minRows={3}
                inputProps={{ maxLength: 160 }}
                helperText={`${draft.bio.length}/160`}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Location"
                value={draft.location}
                onChange={(event) => update("location", event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.show_location}
                    onChange={(event) =>
                      update("show_location", event.target.checked)
                    }
                  />
                }
                label="Show location publicly"
              />
            </Stack>
          )}

          {section === "content" && (
            <Stack className="workspace-panel" spacing={2}>
              <div className="workspace-panel__heading">
                <Box>
                  <Typography variant="h3">Links</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {links.length} {links.length === 1 ? "link" : "links"} on your page
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  href={`/onboarding?template=${draft.template}&step=content`}
                  variant="outlined"
                  startIcon={<InsertLinkRounded />}
                >
                  Edit links
                </Button>
              </div>
              <div className="workspace-content-list">
                {links.slice(0, 4).map((item, index) => (
                  <Paper className="workspace-content-item" variant="outlined" key={item.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Box>
                      <Typography fontWeight={800}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {item.subtitle || item.url}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={item.is_active ? "Visible" : "Hidden"}
                      variant="outlined"
                    />
                  </Paper>
                ))}
                {links.length === 0 && (
                  <Box className="workspace-empty">
                    <InsertLinkRounded />
                    <Typography fontWeight={800}>No links yet</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add a first project, article, or favorite resource.
                    </Typography>
                  </Box>
                )}
              </div>

              <div className="workspace-panel__heading workspace-panel__heading--referrals">
                <Box>
                  <Typography variant="h3">Referral offers</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Codes and perks your audience can use
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  href={`/onboarding?template=${draft.template}&step=content`}
                  variant="outlined"
                  startIcon={<LocalOfferOutlined />}
                >
                  Edit referrals
                </Button>
              </div>
              <div className="workspace-referral-grid">
                {referrals.slice(0, 4).map((item) => (
                  <Paper
                    className="workspace-referral-item"
                    variant="outlined"
                    key={item.id}
                    style={{ "--referral-color": item.color } as React.CSSProperties}
                  >
                    <Typography className="section-label">
                      {item.provider}
                    </Typography>
                    <Typography fontWeight={800}>{item.offer}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.code ? `Code: ${item.code}` : "Direct offer"}
                    </Typography>
                  </Paper>
                ))}
                {referrals.length === 0 && (
                  <Box className="workspace-empty">
                    <LocalOfferOutlined />
                    <Typography fontWeight={800}>No referral offers yet</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add a provider, perk, link, and optional coupon code.
                    </Typography>
                  </Box>
                )}
              </div>
            </Stack>
          )}

          {section === "appearance" && (
            <Stack className="workspace-panel" spacing={3}>
              <TextField
                select
                label="Template"
                value={draft.template}
                onChange={(event) => update("template", event.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              >
                <MenuItem value="field-notes">Field Notes</MenuItem>
                <MenuItem value="after-dark">After Dark</MenuItem>
                <MenuItem value="soft-studio">Soft Studio</MenuItem>
              </TextField>
              <div className="workspace-template-grid">
                {templateOptions.map((template) => (
                  <ButtonBase
                    className={`workspace-template-card ${
                      draft.template === template.id ? "is-selected" : ""
                    }`}
                    onClick={() => update("template", template.id)}
                    aria-label={`Use ${template.name} template`}
                    key={template.id}
                  >
                    <span
                      className="workspace-template-card__swatch"
                      style={{
                        background: template.color,
                        color: template.accent,
                      }}
                    >
                      Aa
                    </span>
                    <span>
                      <b>{template.name}</b>
                      <small>
                        {draft.template === template.id ? "Selected" : "Select template"}
                      </small>
                    </span>
                    {draft.template === template.id && <CheckCircleRounded />}
                  </ButtonBase>
                ))}
              </div>
            </Stack>
          )}

          {section === "analytics" && (
            <div className="workspace-analytics">
              <StatCard label="LINKS" value={links.length} note="Saved destinations" />
              <StatCard
                label="REFERRALS"
                value={referrals.length}
                note="Active offers and codes"
              />
              <StatCard
                label="INTERACTIONS"
                value={interactionCount}
                note="Link opens, offer opens, and copies"
              />
              <Paper className="workspace-analytics__note" variant="outlined">
                <AnalyticsOutlined />
                <Box>
                  <Typography variant="h3">More detail is coming</Typography>
                  <Typography variant="body2" color="text.secondary">
                    The event model is already stored in Supabase. The next analytics
                    view can add date ranges, top links, and referral conversion.
                  </Typography>
                </Box>
              </Paper>
            </div>
          )}

          {section === "account" && (
            <Stack className="workspace-panel" spacing={3}>
              <Box className="workspace-publish-row">
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h3">Public page</Typography>
                    <Chip
                      size="small"
                      color={draft.is_published ? "success" : "default"}
                      variant="outlined"
                      icon={draft.is_published ? <CheckCircleRounded /> : undefined}
                      label={draft.is_published ? "Published" : "Draft"}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Turn this off to keep your page private while you edit it.
                  </Typography>
                </Box>
                <Switch
                  checked={draft.is_published}
                  onChange={(event) =>
                    update("is_published", event.target.checked)
                  }
                  inputProps={{ "aria-label": "Publish public page" }}
                />
              </Box>
              <TextField
                label="Account email"
                value={email}
                fullWidth
                disabled
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button
                color="inherit"
                variant="outlined"
                startIcon={<LogoutRounded />}
                onClick={signOut}
                sx={{ alignSelf: "flex-start" }}
              >
                Sign out
              </Button>
            </Stack>
          )}
        </div>
      </section>

      <aside
        className={`workspace-preview workspace-preview--${draft.template}`}
        aria-label="Live page preview"
      >
        <header className="workspace-preview__topbar">
          <Chip
            label={`linkbranch.com/u/${draft.username || "username"}`}
            variant="outlined"
          />
          <Typography variant="caption">LIVE PREVIEW</Typography>
        </header>
        <div className={`workspace-phone workspace-phone--${draft.template}`}>
          <div className="workspace-phone__cover" />
          <div className="workspace-phone__body">
            <Avatar className="workspace-phone__avatar">{initials}</Avatar>
            <Typography className="workspace-phone__handle">
              @{draft.username || "username"}
            </Typography>
            <Typography component="h2">
              {draft.greeting} {draft.display_name}.
            </Typography>
            <Typography component="h3">
              {draft.headline} <em>{draft.headline_accent}</em>
            </Typography>
            {draft.bio && (
              <Typography className="workspace-phone__bio">{draft.bio}</Typography>
            )}
            {draft.show_location && draft.location && (
              <Typography className="workspace-phone__location">
                {draft.location}
              </Typography>
            )}

            <div className="workspace-phone__links">
              {activeLinks.slice(0, 4).map((item) => (
                <div className="workspace-phone__link" key={item.id}>
                  <span>{item.title}</span>
                  <ArrowOutwardRounded />
                </div>
              ))}
              {activeLinks.length === 0 && (
                <>
                  <div className="workspace-phone__link">
                    <span>Your first project</span>
                    <ArrowOutwardRounded />
                  </div>
                  <div className="workspace-phone__link">
                    <span>A useful resource</span>
                    <ArrowOutwardRounded />
                  </div>
                </>
              )}
            </div>

            {activeReferrals.length > 0 && (
              <div className="workspace-phone__offers">
                <Typography className="section-label">PERKS & REFERRALS</Typography>
                {activeReferrals.slice(0, 2).map((item) => (
                  <div
                    className="workspace-phone__offer"
                    style={{ background: item.color }}
                    key={item.id}
                  >
                    <b>{item.provider}</b>
                    <span>{item.offer}</span>
                    {item.code && <small>{item.code}</small>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          variant="filled"
          severity={notice?.severity ?? "success"}
          onClose={() => setNotice(null)}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </main>
  );
}
