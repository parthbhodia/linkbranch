"use client";

import { useMemo, useState } from "react";
import AnalyticsOutlined from "@mui/icons-material/AnalyticsOutlined";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import ColorLensOutlined from "@mui/icons-material/ColorLensOutlined";
import InsertLinkRounded from "@mui/icons-material/InsertLinkRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import PhotoCameraOutlined from "@mui/icons-material/PhotoCameraOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
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
import { BrandMark } from "@/components/brand-mark";
import { ShareDialog } from "@/components/share-dialog";
import { publicProfileAddress } from "@/lib/brand";
import { creatorInviteUrl } from "@/lib/referrals";
import { useRouter } from "next/navigation";
import { getSocialPlatformIcon } from "@/lib/social-platforms";
import {
  imageExtension,
  publicAssetUrl,
  PUBLIC_ASSET_BUCKET,
  validateImage,
} from "@/lib/storage";
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
  seo_title: string | null;
  seo_description: string | null;
  seo_image_path: string | null;
  show_cueful_badge: boolean;
  is_discoverable: boolean;
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
  thumbnail_path: string | null;
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

export type DashboardSocial = {
  platform: string;
  url: string;
  position: number;
};

export type DashboardEvent = {
  event_type: "link_open" | "referral_open" | "referral_copy";
  link_id: number | null;
  referral_id: number | null;
  occurred_at: string;
  device_type: string | null;
  country_code: string | null;
  referrer: string | null;
};

export type DashboardView = {
  occurred_at: string;
  device_type: string | null;
  country_code: string | null;
  referrer: string | null;
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
  value: number | string;
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
  socials,
  events,
  views,
  referralCount,
}: {
  profile: DashboardProfile;
  email: string;
  links: DashboardLink[];
  referrals: DashboardReferral[];
  socials: DashboardSocial[];
  events: DashboardEvent[];
  views: DashboardView[];
  referralCount: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(profile);
  const [section, setSection] = useState<WorkspaceSection>("profile");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [seoImageUploading, setSeoImageUploading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
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
  const analytics = useMemo(() => {
    const linkOpens = events.filter((event) => event.event_type === "link_open").length;
    const referralOpens = events.filter(
      (event) => event.event_type === "referral_open",
    ).length;
    const referralCopies = events.filter(
      (event) => event.event_type === "referral_copy",
    ).length;
    const outboundClicks = linkOpens + referralOpens;

    const content = new Map<
      string,
      { label: string; type: "Link" | "Referral"; opens: number; copies: number }
    >();

    links.forEach((link) => {
      content.set(`link-${link.id}`, {
        label: link.title,
        type: "Link",
        opens: 0,
        copies: 0,
      });
    });
    referrals.forEach((referral) => {
      content.set(`referral-${referral.id}`, {
        label: referral.provider,
        type: "Referral",
        opens: 0,
        copies: 0,
      });
    });

    events.forEach((event) => {
      const key = event.link_id
        ? `link-${event.link_id}`
        : event.referral_id
          ? `referral-${event.referral_id}`
          : "";
      const item = content.get(key);
      if (!item) return;
      if (event.event_type === "referral_copy") item.copies += 1;
      else item.opens += 1;
    });

    const topContent = [...content.values()]
      .filter((item) => item.opens > 0 || item.copies > 0)
      .sort((a, b) => b.opens + b.copies - (a.opens + a.copies))
      .slice(0, 5);

    const days = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - offset));
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1),
        value: 0,
      };
    });
    const dayMap = new Map(days.map((day) => [day.key, day]));
    views.forEach((view) => {
      const day = dayMap.get(view.occurred_at.slice(0, 10));
      if (day) day.value += 1;
    });

    function mostCommon(values: Array<string | null>) {
      const counts = new Map<string, number>();
      values.filter(Boolean).forEach((value) => {
        counts.set(value as string, (counts.get(value as string) ?? 0) + 1);
      });
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    }

    const topReferrer = mostCommon(
      views.map((view) => {
        if (!view.referrer) return "Direct";
        try {
          return new URL(view.referrer).hostname.replace(/^www\./, "");
        } catch {
          return "Direct";
        }
      }),
    );

    return {
      views: views.length,
      outboundClicks,
      linkOpens,
      referralOpens,
      referralCopies,
      ctr:
        views.length > 0
          ? Math.min(100, Math.round((outboundClicks / views.length) * 100))
          : 0,
      copyRate:
        referralOpens > 0
          ? Math.min(100, Math.round((referralCopies / referralOpens) * 100))
          : 0,
      days,
      topContent,
      topDevice: mostCommon(views.map((view) => view.device_type)),
      topCountry: mostCommon(views.map((view) => view.country_code)),
      topReferrer,
    };
  }, [events, links, referrals, views]);
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
        seo_title: draft.seo_title?.trim() || null,
        seo_description: draft.seo_description?.trim() || null,
        show_cueful_badge: draft.show_cueful_badge,
        is_discoverable: draft.is_discoverable,
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

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setNotice({ severity: "error", message: validationError });
      return;
    }

    setAvatarUploading(true);
    const supabase = createClient();
    const path = `${profile.id}/profile/avatar-${crypto.randomUUID()}.${imageExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_ASSET_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setAvatarUploading(false);
      setNotice({ severity: "error", message: uploadError.message });
      return;
    }

    const previousPath = draft.avatar_path;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_path: path })
      .eq("id", profile.id);

    if (profileError) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([path]);
      setAvatarUploading(false);
      setNotice({ severity: "error", message: profileError.message });
      return;
    }

    if (previousPath) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([previousPath]);
    }

    update("avatar_path", path);
    setAvatarUploading(false);
    setNotice({ severity: "success", message: "Profile photo updated." });
    router.refresh();
  }

  async function removeAvatar() {
    if (!draft.avatar_path) return;

    setAvatarUploading(true);
    const supabase = createClient();
    const previousPath = draft.avatar_path;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_path: null })
      .eq("id", profile.id);

    if (error) {
      setAvatarUploading(false);
      setNotice({ severity: "error", message: error.message });
      return;
    }

    await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([previousPath]);
    update("avatar_path", null);
    setAvatarUploading(false);
    setNotice({ severity: "success", message: "Profile photo removed." });
    router.refresh();
  }

  async function uploadSeoImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setNotice({ severity: "error", message: validationError });
      return;
    }

    setSeoImageUploading(true);
    const supabase = createClient();
    const path = `${profile.id}/seo/social-${crypto.randomUUID()}.${imageExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_ASSET_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setSeoImageUploading(false);
      setNotice({ severity: "error", message: uploadError.message });
      return;
    }

    const previousPath = draft.seo_image_path;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ seo_image_path: path })
      .eq("id", profile.id);

    if (profileError) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([path]);
      setSeoImageUploading(false);
      setNotice({ severity: "error", message: profileError.message });
      return;
    }

    if (previousPath) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([previousPath]);
    }

    update("seo_image_path", path);
    setSeoImageUploading(false);
    setNotice({ severity: "success", message: "Social sharing image updated." });
    router.refresh();
  }

  async function removeSeoImage() {
    if (!draft.seo_image_path) return;

    setSeoImageUploading(true);
    const supabase = createClient();
    const previousPath = draft.seo_image_path;
    const { error } = await supabase
      .from("profiles")
      .update({ seo_image_path: null })
      .eq("id", profile.id);

    if (error) {
      setSeoImageUploading(false);
      setNotice({ severity: "error", message: error.message });
      return;
    }

    await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([previousPath]);
    update("seo_image_path", null);
    setSeoImageUploading(false);
    setNotice({ severity: "success", message: "Social sharing image removed." });
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
        <BrandMark className="workspace-rail__brand" compact />
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
            {/* The shareable address was previously only discoverable as a chip
                further down the page, which people missed. Surface copy next to
                open, where you look when you want to send someone your page. */}
            <Tooltip title={`Copy ${publicProfileAddress(draft.username || "username")}`} arrow>
              <IconButton
                onClick={async () => {
                  const address = publicProfileAddress(draft.username || "username");
                  try {
                    await navigator.clipboard.writeText(`https://${address}`);
                    setNotice({ severity: "success", message: `Copied ${address}` });
                  } catch {
                    // Clipboard needs a secure context and can be blocked, so
                    // show the address itself as the fallback.
                    setNotice({
                      severity: "error",
                      message: `Couldn't copy — your page is at ${address}`,
                    });
                  }
                }}
                aria-label="Copy public page link"
              >
                <ContentCopyRounded />
              </IconButton>
            </Tooltip>
            {draft.is_published && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<IosShareRounded />}
                  onClick={() => setShareOpen(true)}
                >
                  Share
                </Button>
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
              </>
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
                <Avatar src={publicAssetUrl(draft.avatar_path)}>{initials}</Avatar>
                <Box>
                  <Typography variant="h3">{draft.display_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{draft.username}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={
                      avatarUploading
                        ? <CircularProgress size={16} />
                        : <PhotoCameraOutlined />
                    }
                    disabled={avatarUploading}
                  >
                    {draft.avatar_path ? "Replace" : "Upload photo"}
                    <input
                      hidden
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={uploadAvatar}
                    />
                  </Button>
                  {draft.avatar_path && (
                    <Button
                      color="inherit"
                      onClick={removeAvatar}
                      disabled={avatarUploading}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
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
                helperText={`Public URL: ${publicProfileAddress(draft.username || "username")}`}
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
              <Paper className="workspace-seo-editor" variant="outlined">
                <div className="workspace-panel__heading">
                  <Box>
                    <Typography variant="h3">Search & sharing</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Control how this profile is introduced in search results
                      and social previews.
                    </Typography>
                  </Box>
                  <SearchRounded />
                </div>
                <TextField
                  label="SEO title"
                  value={draft.seo_title ?? ""}
                  onChange={(event) => update("seo_title", event.target.value)}
                  placeholder={`${draft.display_name} — links and recommendations`}
                  inputProps={{ maxLength: 70 }}
                  helperText={`${draft.seo_title?.length ?? 0}/70 · Leave blank to use your display name`}
                  slotProps={{ inputLabel: { shrink: true } }}
                  fullWidth
                />
                <TextField
                  label="SEO description"
                  value={draft.seo_description ?? ""}
                  onChange={(event) => update("seo_description", event.target.value)}
                  placeholder={draft.bio || "A clear summary of this public page."}
                  inputProps={{ maxLength: 170 }}
                  helperText={`${draft.seo_description?.length ?? 0}/170 · Leave blank to use your profile bio`}
                  slotProps={{ inputLabel: { shrink: true } }}
                  multiline
                  minRows={3}
                  fullWidth
                />
                <div className="workspace-seo-image">
                  {draft.seo_image_path ? (
                    <Box
                      component="img"
                      src={publicAssetUrl(draft.seo_image_path)}
                      alt="Current social sharing preview"
                    />
                  ) : (
                    <div>
                      <Typography variant="h3">1200 × 630</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Optional social sharing image
                      </Typography>
                    </div>
                  )}
                  <Stack direction="row" spacing={1}>
                    <Button
                      component="label"
                      variant="outlined"
                      disabled={seoImageUploading}
                      startIcon={
                        seoImageUploading
                          ? <CircularProgress size={16} />
                          : <PhotoCameraOutlined />
                      }
                    >
                      {draft.seo_image_path ? "Replace image" : "Upload image"}
                      <input
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={uploadSeoImage}
                      />
                    </Button>
                    {draft.seo_image_path && (
                      <Button
                        color="inherit"
                        disabled={seoImageUploading}
                        onClick={removeSeoImage}
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>
                </div>
              </Paper>
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
              <StatCard
                label="LIFETIME VIEWS"
                value={analytics.views}
                note="Public profile visits"
              />
              <StatCard
                label="TOTAL CLICKS"
                value={analytics.outboundClicks}
                note={`${analytics.linkOpens} links · ${analytics.referralOpens} offers`}
              />
              <StatCard
                label="CLICK RATE"
                value={`${analytics.ctr}%`}
                note="Clicks divided by profile views"
              />
              <StatCard
                label="CODE COPIES"
                value={analytics.referralCopies}
                note={`${analytics.copyRate}% of offer opens`}
              />

              <Paper className="workspace-analytics__chart-card" variant="outlined">
                <div className="workspace-analytics__card-heading">
                  <Box>
                    <Typography variant="h3">Profile views</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Visits recorded over the last seven days
                    </Typography>
                  </Box>
                  <Chip label="7 DAYS" size="small" variant="outlined" />
                </div>
                <div className="workspace-analytics__bars" aria-label="Seven day activity chart">
                  {analytics.days.map((day) => {
                    const maximum = Math.max(
                      1,
                      ...analytics.days.map((item) => item.value),
                    );
                    return (
                      <div key={day.key}>
                        <span>{day.value}</span>
                        <i
                          style={{
                            height: `${Math.max(4, (day.value / maximum) * 100)}%`,
                          }}
                        />
                        <small>{day.label}</small>
                      </div>
                    );
                  })}
                </div>
              </Paper>

              <Paper className="workspace-analytics__insights" variant="outlined">
                <div className="workspace-analytics__card-heading">
                  <Box>
                    <Typography variant="h3">Audience signals</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your strongest traffic patterns
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-analytics__signal-grid">
                  <span><small>TOP REFERRER</small><b>{analytics.topReferrer}</b></span>
                  <span><small>TOP DEVICE</small><b>{analytics.topDevice}</b></span>
                  <span><small>TOP COUNTRY</small><b>{analytics.topCountry}</b></span>
                </div>
              </Paper>

              <Paper className="workspace-analytics__ranking" variant="outlined">
                <div className="workspace-analytics__card-heading">
                  <Box>
                    <Typography variant="h3">Top content</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ranked by opens and code copies
                    </Typography>
                  </Box>
                </div>
                {analytics.topContent.length > 0 ? (
                  <ol>
                    {analytics.topContent.map((item, index) => (
                      <li key={`${item.type}-${item.label}`}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span><b>{item.label}</b><small>{item.type}</small></span>
                        <strong>{item.opens + item.copies}</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="workspace-analytics__empty">
                    <AnalyticsOutlined />
                    <Typography variant="h3">No activity yet</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Share your public page. Link opens, referral opens, and code
                      copies will appear here automatically.
                    </Typography>
                  </div>
                )}
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
              <Paper className="workspace-growth-loop" variant="outlined">
                <div className="workspace-growth-loop__header">
                  <Box>
                    <Chip size="small" label="ALWAYS OPT-IN" variant="outlined" />
                    <Typography variant="h3">Help another creator find Cueful</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use a small supporter badge or share your personal invite.
                      Published referrals improve your position in Discover.
                    </Typography>
                  </Box>
                  <div className="workspace-growth-loop__score">
                    <b>{referralCount}</b>
                    <span>published referrals</span>
                  </div>
                </div>

                <div className="workspace-growth-loop__invite">
                  <code>{creatorInviteUrl(draft.username)}</code>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopyRounded />}
                    onClick={async () => {
                      const invite = creatorInviteUrl(draft.username);
                      try {
                        await navigator.clipboard.writeText(invite);
                        setNotice({
                          severity: "success",
                          message: "Creator invite copied.",
                        });
                      } catch {
                        setNotice({
                          severity: "error",
                          message: `Couldn't copy — use ${invite}`,
                        });
                      }
                    }}
                  >
                    Copy invite
                  </Button>
                </div>

                <FormControlLabel
                  control={
                    <Switch
                      checked={draft.show_cueful_badge}
                      onChange={(event) =>
                        update("show_cueful_badge", event.target.checked)
                      }
                    />
                  }
                  label="Show a small “Create your Cueful” badge on my profile"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={draft.is_discoverable}
                      onChange={(event) =>
                        update("is_discoverable", event.target.checked)
                      }
                    />
                  }
                  label="List my published profile in Cueful Discover"
                />
                <Typography variant="caption" color="text.secondary">
                  Both settings are off by default. Turning them off later
                  removes the badge or directory listing.
                </Typography>
              </Paper>
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
            label={publicProfileAddress(draft.username || "username")}
            variant="outlined"
          />
          <Typography variant="caption">LIVE PREVIEW</Typography>
        </header>
        <div className={`workspace-phone workspace-phone--${draft.template}`}>
          <div className="workspace-phone__body">
            <Avatar
              className="workspace-phone__avatar"
              src={publicAssetUrl(draft.avatar_path)}
            >
              {initials}
            </Avatar>
            <Typography className="workspace-phone__handle">
              @{draft.username || "username"}
            </Typography>
            <Typography component="h2">{draft.greeting} {draft.display_name}.</Typography>
            <Typography component="h3">{draft.headline} <em>{draft.headline_accent}</em></Typography>
            {draft.bio && (
              <Typography className="workspace-phone__bio">{draft.bio}</Typography>
            )}
            {draft.show_location && draft.location && (
              <Typography className="workspace-phone__location">
                {draft.location}
              </Typography>
            )}

            {socials.length > 0 && (
              <div className="workspace-phone__socials" aria-label="Social profile preview">
                {socials.slice(0, 5).map((social) => (
                  <span title={social.platform} key={social.platform}>
                    {getSocialPlatformIcon(social.platform)}
                  </span>
                ))}
              </div>
            )}

            <div className="workspace-phone__search">
              <SearchRounded />
              <span>Search links and offers…</span>
            </div>

            {activeReferrals.length > 0 && (
              <div className="workspace-phone__offers">
                <div className="workspace-phone__section-heading">
                  <Typography className="section-label">PERKS & REFERRALS</Typography>
                  <small>SWIPE →</small>
                </div>
                <div className="workspace-phone__offer-rail">
                  {activeReferrals.slice(0, 2).map((item) => (
                    <div
                      className="workspace-phone__offer"
                      style={{ background: item.color }}
                      key={item.id}
                    >
                      <b>{item.provider}</b>
                      <span>{item.offer}</span>
                      <small>{item.code ? `COPY · ${item.code}` : "OPEN OFFER"}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="workspace-phone__section-heading workspace-phone__section-heading--links">
              <Typography className="section-label">MY LINKS</Typography>
              <small>{activeLinks.length || 2} DESTINATIONS</small>
            </div>
            <div className="workspace-phone__links">
              {activeLinks.slice(0, 4).map((item) => (
                <div className="workspace-phone__link" key={item.id}>
                  {item.thumbnail_path && (
                    <Box
                      component="img"
                      className="workspace-phone__link-image"
                      src={publicAssetUrl(item.thumbnail_path)}
                      alt=""
                    />
                  )}
                  <span>
                    <b>{item.title}</b>
                    {item.subtitle && <small>{item.subtitle}</small>}
                  </span>
                  <ArrowOutwardRounded />
                </div>
              ))}
              {activeLinks.length === 0 && (
                <>
                  <div className="workspace-phone__link">
                    <span><b>Your first project</b><small>Share something worth opening</small></span>
                    <ArrowOutwardRounded />
                  </div>
                  <div className="workspace-phone__link">
                    <span><b>A useful resource</b><small>Give it a little context</small></span>
                    <ArrowOutwardRounded />
                  </div>
                </>
              )}
            </div>
            {draft.show_cueful_badge && (
              <div className="workspace-phone__supporter-badge">
                Create your Cueful
                <ArrowOutwardRounded />
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
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        username={draft.username}
        displayName={draft.display_name}
      />
    </main>
  );
}
