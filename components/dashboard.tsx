"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AnalyticsOutlined from "@mui/icons-material/AnalyticsOutlined";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import ColorLensOutlined from "@mui/icons-material/ColorLensOutlined";
import EditRounded from "@mui/icons-material/EditRounded";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import InsertLinkRounded from "@mui/icons-material/InsertLinkRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import MoreHorizRounded from "@mui/icons-material/MoreHorizRounded";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import PhotoCameraOutlined from "@mui/icons-material/PhotoCameraOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import StarOutlineRounded from "@mui/icons-material/StarOutlineRounded";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import LanguageRounded from "@mui/icons-material/LanguageRounded";
import HubOutlined from "@mui/icons-material/HubOutlined";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import QrCode2Rounded from "@mui/icons-material/QrCode2Rounded";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { AudienceMap } from "@/components/audience-map";
import { BrandMark } from "@/components/brand-mark";
import {
  CommerceMediaEditor,
  type DashboardMediaEmbed,
  type DashboardProduct,
} from "@/components/commerce-media-editor";
import {
  ConnectionsInbox,
  type DashboardConnection,
} from "@/components/connections-inbox";
import { FaqEditor, type DashboardFaq } from "@/components/faq-editor";
import {
  HighlightsEditor,
  type DashboardHighlight,
} from "@/components/highlights-editor";
import { LinkHealthScanner } from "@/components/link-health-scanner";
import {
  resolveSeoDescription,
  resolveSeoTitle,
  SeoPreview,
} from "@/components/seo-preview";
import { SettingsConnectEditor } from "@/components/settings-connect-editor";
import {
  SettingsJumpNav,
  type SettingsJumpId,
} from "@/components/settings-jump-nav";
import { ShareDialog } from "@/components/share-dialog";
import { LinksEditor, type LinkDraft } from "@/components/links-editor";
import {
  ReferralsEditor,
  type ReferralDraft,
} from "@/components/referrals-editor";
import { normalizeHttpUrl } from "@/lib/urls";
import {
  BRAND_URL,
  DEFAULT_SOCIAL_IMAGE,
  publicProfileAddress,
  publicProfilePath,
} from "@/lib/brand";
import { creatorInviteUrl } from "@/lib/referrals";
import { useRouter } from "next/navigation";
import { getSocialPlatformIcon } from "@/lib/social-platforms";
import {
  faviconExtension,
  imageExtension,
  publicAssetUrl,
  PUBLIC_ASSET_BUCKET,
  validateFavicon,
  validateImage,
} from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import {
  defaultProfileTheme,
  profileThemeClassName,
  profileThemeStyle,
  resolveProfileTheme,
  themeBackgroundOptions,
  themePalettes,
  type ProfileThemeConfig,
} from "@/lib/theme-config";

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
  tags: string[];
  template: string;
  avatar_path: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_path: string | null;
  favicon_path: string | null;
  seo_og_title: string | null;
  seo_og_description: string | null;
  seo_keywords: string | null;
  seo_noindex: boolean;
  twitter_card_style: "summary" | "summary_large_image";
  canonical_url: string | null;
  show_cueful_badge: boolean;
  is_discoverable: boolean;
  is_published: boolean;
  onboarding_completed: boolean;
  theme_config: unknown;
  disclosure_text: string | null;
  job_title: string | null;
  company: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  show_save_contact: boolean;
  show_exchange: boolean;
  current_event_tag: string | null;
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
  event_type:
    | "link_open"
    | "referral_open"
    | "referral_copy"
    | "product_open"
    | "media_open";
  link_id: number | null;
  referral_id: number | null;
  product_id: number | null;
  media_embed_id: number | null;
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
  | "connections"
  | "content"
  | "commerce"
  | "appearance"
  | "analytics"
  | "account"
  | "more"
  | "highlights"
  | "health";

const workspaceSections: Array<{
  id: WorkspaceSection;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "profile", label: "Profile", icon: <PersonOutlineRounded /> },
  { id: "connections", label: "People you met", icon: <GroupsOutlined /> },
  { id: "content", label: "Links & referrals", icon: <InsertLinkRounded /> },
  { id: "commerce", label: "Shop & media", icon: <StorefrontOutlined /> },
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
  connections: {
    eyebrow: "PEOPLE",
    title: "Sort the stack while it’s fresh",
    body: "Everyone who swapped details with you, grouped by where you met them.",
  },
  content: {
    eyebrow: "CONTENT",
    title: "Arrange every useful branch",
    body: "Keep projects, resources, and referral offers in one clear list.",
  },
  commerce: {
    eyebrow: "SHOP & MEDIA",
    title: "Give every release a richer card",
    body: "Add products with external checkout, music players, and a clear disclosure.",
  },
  appearance: {
    eyebrow: "DESIGN",
    title: "Make the page unmistakably yours",
    body: "Start with a direction, then tune color, type, buttons, and spacing.",
  },
  analytics: {
    eyebrow: "ACTIVITY",
    title: "See how attention turns into action",
    body: "Understand visits, sources, countries, clicks, and referral intent.",
  },
  account: {
    eyebrow: "ACCOUNT",
    title: "Settings",
    body: "Profile details, SEO, QR sharing, visibility, privacy, and sign-in.",
  },
  more: {
    eyebrow: "TOOLS",
    title: "More",
    body: "Shortcuts for timely updates, link checks, and account settings.",
  },
  highlights: {
    eyebrow: "STORIES",
    title: "Highlights",
    body: "Post a temporary visual update that disappears after 24 hours.",
  },
  health: {
    eyebrow: "LINK HEALTH",
    title: "Check every destination",
    body: "Scan the live links on your page and fix destinations that stop responding.",
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
  {
    id: "signal-deck",
    name: "Signal Deck",
    color: "#0f141c",
    accent: "#b9ff66",
  },
];

const themeFontOptions: Array<{
  id: ProfileThemeConfig["font"];
  name: string;
  sample: string;
}> = [
  { id: "studio", name: "Studio", sample: "Useful things" },
  { id: "editorial", name: "Editorial", sample: "Useful things" },
  { id: "rounded", name: "Rounded", sample: "Useful things" },
  { id: "mono", name: "Mono", sample: "USEFUL THINGS" },
];

const themeColorFields: Array<{
  key: keyof ProfileThemeConfig["colors"];
  label: string;
}> = [
  { key: "background", label: "Background" },
  { key: "surface", label: "Cards" },
  { key: "text", label: "Main text" },
  { key: "muted", label: "Quiet text" },
  { key: "accent", label: "Accent" },
  { key: "button", label: "Buttons" },
  { key: "buttonText", label: "Button text" },
];

const dashboardTour = [
  {
    section: "profile" as WorkspaceSection,
    eyebrow: "01 · PROFILE",
    title: "Start with the promise",
    body: "Your name, headline, and photo tell visitors immediately whether this page is for them.",
  },
  {
    section: "content" as WorkspaceSection,
    eyebrow: "02 · CONTENT",
    title: "Arrange the next actions",
    body: "Links share destinations. Referral cards explain a benefit and track offer opens or code copies.",
  },
  {
    section: "commerce" as WorkspaceSection,
    eyebrow: "03 · SHOP & MEDIA",
    title: "Sell or play without the bloat",
    body: "Product cards send people to your existing checkout. Media blocks support trusted music and video providers without autoplay.",
  },
  {
    section: "appearance" as WorkspaceSection,
    eyebrow: "04 · APPEARANCE",
    title: "Make it recognizable",
    body: "Choose a direction, then tune colors, type, button shape, texture, and spacing.",
  },
  {
    section: "analytics" as WorkspaceSection,
    eyebrow: "05 · ANALYTICS",
    title: "Learn from real intent",
    body: "See visits, click-through rate, sources, countries, devices, and the content people act on.",
  },
  {
    section: "account" as WorkspaceSection,
    eyebrow: "06 · SHARE",
    title: "Publish once, share everywhere",
    body: "Copy your public URL or open the Share Kit for QR codes and ready-to-post assets.",
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
  products,
  mediaEmbeds,
  faqs,
  highlights,
  connections,
  referralCount,
}: {
  profile: DashboardProfile;
  email: string;
  links: DashboardLink[];
  referrals: DashboardReferral[];
  socials: DashboardSocial[];
  events: DashboardEvent[];
  views: DashboardView[];
  products: DashboardProduct[];
  mediaEmbeds: DashboardMediaEmbed[];
  faqs: DashboardFaq[];
  highlights: DashboardHighlight[];
  connections: DashboardConnection[];
  referralCount: number;
}) {
  const router = useRouter();
  // Raw text for the comma-separated tags field while it has focus; null hands
  // display back to the parsed array. See the field for why.
  const [tagsText, setTagsText] = useState<string | null>(null);
  // Links are edited here now rather than by bouncing into the setup wizard,
  // so the dashboard keeps its own draft of them alongside the profile draft.
  const [linkDraft, setLinkDraft] = useState<LinkDraft[]>(() =>
    links.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      is_active: item.is_active,
      is_featured: item.is_featured,
      thumbnail_path: item.thumbnail_path,
    })),
  );
  const [savingLinks, setSavingLinks] = useState(false);
  const [referralDraft, setReferralDraft] = useState<ReferralDraft[]>(() =>
    referrals.map((item) => ({
      id: item.id,
      provider: item.provider,
      offer: item.offer,
      url: item.url,
      code: item.code ?? "",
      color: item.color,
      is_active: item.is_active,
    })),
  );
  const [savingReferrals, setSavingReferrals] = useState(false);
  // Thumbnails replaced or removed while editing. They stay in storage until
  // the save succeeds, because until then the old path is still the live one.
  const orphanedThumbnails = useRef<Set<string>>(new Set());
  const [draft, setDraft] = useState(() => ({
    ...profile,
    tags: Array.isArray(profile.tags) ? profile.tags : [],
    seo_og_title: profile.seo_og_title ?? null,
    seo_og_description: profile.seo_og_description ?? null,
    seo_keywords: profile.seo_keywords ?? null,
    seo_noindex: profile.seo_noindex ?? false,
    twitter_card_style: profile.twitter_card_style ?? "summary_large_image",
    canonical_url: profile.canonical_url ?? null,
    job_title: profile.job_title ?? null,
    company: profile.company ?? null,
    contact_email: profile.contact_email ?? null,
    contact_phone: profile.contact_phone ?? null,
    show_save_contact: profile.show_save_contact ?? true,
    show_exchange: profile.show_exchange ?? true,
    theme_config: resolveProfileTheme(profile.theme_config, profile.template),
  }));
  const [connectedSocials, setConnectedSocials] = useState(socials);
  const [settingsJump, setSettingsJump] = useState<SettingsJumpId | null>(null);
  const [exportingData, setExportingData] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [section, setSection] = useState<WorkspaceSection>("profile");
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");
  const editorScrollRef = useRef<HTMLDivElement | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<"7d" | "30d" | "all">(
    "30d",
  );
  const [analyticsBucket, setAnalyticsBucket] = useState(6);
  const [analyticsNow] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [seoImageUploading, setSeoImageUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [brandingUploading, setBrandingUploading] = useState<
    null | "logo" | "wallpaper"
  >(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [sharePromptOpen, setSharePromptOpen] = useState(false);
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const shareKey = `cueful:share-prompt:${profile.id}`;
    const timer = window.setTimeout(() => {
      if (
        profile.is_published &&
        window.localStorage.getItem(shareKey) !== "dismissed"
      ) {
        setSharePromptOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [profile.id, profile.is_published]);

  useEffect(() => {
    editorScrollRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [section, mobileMode]);

  const activeLinks = useMemo(
    () => links.filter((item) => item.is_active),
    [links],
  );
  const activeReferrals = useMemo(
    () => referrals.filter((item) => item.is_active),
    [referrals],
  );
  const activeTheme = resolveProfileTheme(draft.theme_config, draft.template);
  const brandingLogoUrl = publicAssetUrl(activeTheme.logoPath);
  const wallpaperUrl = publicAssetUrl(activeTheme.wallpaperPath);
  const seoPreviewTitle = resolveSeoTitle({
    seoTitle: draft.seo_title,
    displayName: draft.display_name,
    username: draft.username,
  });
  const seoPreviewDescription = resolveSeoDescription({
    seoDescription: draft.seo_description,
    bio: draft.bio,
    username: draft.username,
  });
  const seoSocialTitle =
    draft.seo_og_title?.trim() || seoPreviewTitle;
  const seoSocialDescription =
    draft.seo_og_description?.trim() || seoPreviewDescription;
  // Same fallback the page metadata uses (app/u/[username]/page.tsx). Without
  // it the preview showed an empty 1200x630 box whenever nothing had been
  // uploaded, while the card people actually see falls back to the generated
  // /opengraph-image -- so the panel was reporting a blank share card that
  // never happens.
  // A canonical pointing at another domain tells search engines this page is a
  // duplicate of one elsewhere, which quietly removes the profile from results.
  // The database rejects it too; this is here so the creator finds out while
  // typing rather than on save.
  const canonicalValue = draft.canonical_url?.trim() ?? "";
  const canonicalError =
    canonicalValue && !canonicalValue.toLowerCase().startsWith(`${BRAND_URL}/`)
      ? `Must start with ${BRAND_URL}/ — a canonical on another domain hides this page from search.`
      : null;

  const seoPreviewImage =
    publicAssetUrl(draft.seo_image_path) ?? DEFAULT_SOCIAL_IMAGE;
  const analytics = useMemo(() => {
    const knownDates = [...views, ...events]
      .map((item) => new Date(item.occurred_at).getTime())
      .filter(Number.isFinite);
    const earliest = Math.min(analyticsNow, ...knownDates);
    const cutoff =
      analyticsRange === "7d"
        ? analyticsNow - 7 * 86_400_000
        : analyticsRange === "30d"
          ? analyticsNow - 30 * 86_400_000
          : earliest;
    const filteredViews = views.filter(
      (view) => new Date(view.occurred_at).getTime() >= cutoff,
    );
    const filteredEvents = events.filter(
      (event) => new Date(event.occurred_at).getTime() >= cutoff,
    );
    const linkOpens = filteredEvents.filter(
      (event) => event.event_type === "link_open",
    ).length;
    const referralOpens = filteredEvents.filter(
      (event) => event.event_type === "referral_open",
    ).length;
    const referralCopies = filteredEvents.filter(
      (event) => event.event_type === "referral_copy",
    ).length;
    const productOpens = filteredEvents.filter(
      (event) => event.event_type === "product_open",
    ).length;
    const mediaOpens = filteredEvents.filter(
      (event) => event.event_type === "media_open",
    ).length;
    const outboundClicks = linkOpens + referralOpens + productOpens + mediaOpens;

    const content = new Map<
      string,
      {
        label: string;
        type: "Link" | "Referral" | "Product" | "Media";
        opens: number;
        copies: number;
      }
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
    products.forEach((product) => {
      content.set(`product-${product.id}`, {
        label: product.title,
        type: "Product",
        opens: 0,
        copies: 0,
      });
    });
    mediaEmbeds.forEach((embed) => {
      content.set(`media-${embed.id}`, {
        label: embed.title,
        type: "Media",
        opens: 0,
        copies: 0,
      });
    });

    filteredEvents.forEach((event) => {
      const key = event.link_id
        ? `link-${event.link_id}`
        : event.referral_id
          ? `referral-${event.referral_id}`
          : event.product_id
            ? `product-${event.product_id}`
            : event.media_embed_id
              ? `media-${event.media_embed_id}`
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

    const bucketCount = 7;
    const bucketSpan = Math.max(86_400_000, (analyticsNow - cutoff) / bucketCount);
    // Anchored so the last bucket ends now, rather than starting at the cutoff
    // and running forward. With the one-day floor, a range shorter than seven
    // days -- All Time on a young page -- made seven day-wide buckets overshoot
    // today: the final ones began in the future, counted nothing, and their
    // label read backwards ("Aug 3 - Jul 31") because the end was clamped to
    // now while the start was not.
    const windowStart = analyticsNow - bucketSpan * bucketCount;
    const days = Array.from({ length: bucketCount }, (_, offset) => {
      const start = windowStart + bucketSpan * offset;
      const end = offset === bucketCount - 1 ? analyticsNow + 1 : start + bucketSpan;
      const date = new Date(start);
      return {
        key: String(offset),
        label:
          analyticsRange === "7d"
            ? date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)
            : date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        periodLabel: `${date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} – ${new Date(Math.min(end - 1, analyticsNow)).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" },
        )}`,
        value: filteredViews.filter((view) => {
          const timestamp = new Date(view.occurred_at).getTime();
          return timestamp >= start && timestamp < end;
        }).length,
        clicks: filteredEvents.filter((event) => {
          const timestamp = new Date(event.occurred_at).getTime();
          return (
            timestamp >= start &&
            timestamp < end &&
            event.event_type !== "referral_copy"
          );
        }).length,
      };
    });

    function countValues(values: Array<string | null>) {
      const counts = new Map<string, number>();
      values.filter(Boolean).forEach((value) => {
        counts.set(value as string, (counts.get(value as string) ?? 0) + 1);
      });
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({
          label,
          count,
          share: values.length > 0 ? Math.round((count / values.length) * 100) : 0,
        }));
    }

    const sources = countValues(
      filteredViews.map((view) => {
        if (!view.referrer) return "Direct";
        try {
          return new URL(view.referrer).hostname.replace(/^www\./, "");
        } catch {
          return "Direct";
        }
      }),
    );
    const devices = countValues(
      filteredViews.map((view) =>
        view.device_type
          ? view.device_type.charAt(0).toUpperCase() + view.device_type.slice(1)
          : "Unknown",
      ),
    );
    const countries = countValues(
      filteredViews.map((view) => view.country_code?.toUpperCase() ?? "Unknown"),
    ).filter((item) => item.label !== "Unknown");
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    const topCountry =
      countries[0] && countries[0].label.length === 2
        ? regionNames.of(countries[0].label) ?? countries[0].label
        : countries[0]?.label ?? "—";

    return {
      views: filteredViews.length,
      outboundClicks,
      linkOpens,
      referralOpens,
      referralCopies,
      productOpens,
      mediaOpens,
      ctr:
        filteredViews.length > 0
          ? Math.min(100, Math.round((outboundClicks / filteredViews.length) * 100))
          : 0,
      copyRate:
        referralOpens > 0
          ? Math.min(100, Math.round((referralCopies / referralOpens) * 100))
          : 0,
      days,
      topContent,
      topDevice: devices[0]?.label ?? "—",
      topCountry,
      topReferrer: sources[0]?.label ?? "—",
      sources,
      devices,
      countries: countries.map((item) => ({
        code: item.label,
        count: item.count,
        share: item.share,
        name:
          item.label.length === 2
            ? regionNames.of(item.label) ?? item.label
            : item.label,
      })),
      rangeLabel:
        analyticsRange === "7d"
          ? "Last 7 days"
          : analyticsRange === "30d"
            ? "Last 30 days"
            : "All time",
    };
  }, [
    analyticsNow,
    analyticsRange,
    events,
    links,
    mediaEmbeds,
    products,
    referrals,
    views,
  ]);
  const selectedAnalyticsPeriod =
    analytics.days[Math.min(analyticsBucket, analytics.days.length - 1)];
  const sectionDetails = sectionCopy[section];
  const initials =
    draft.display_name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LB";

  function parseTags(raw: string) {
    return raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 16);
  }

  function update<K extends keyof DashboardProfile>(
    field: K,
    value: DashboardProfile[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateTheme(
    updater: (current: ProfileThemeConfig) => ProfileThemeConfig,
  ) {
    setDraft((current) => ({
      ...current,
      theme_config: updater(
        resolveProfileTheme(current.theme_config, current.template),
      ),
    }));
  }

  function selectTemplate(template: string) {
    setDraft((current) => {
      const previous = resolveProfileTheme(current.theme_config, current.template);
      const next = defaultProfileTheme(template);
      return {
        ...current,
        template,
        theme_config: {
          ...next,
          logoPath: previous.logoPath ?? null,
          wallpaperPath: previous.wallpaperPath ?? null,
        },
      };
    });
  }

  async function copyPublicPage() {
    const address = publicProfileAddress(draft.username || "username");
    try {
      await navigator.clipboard.writeText(`https://${address}`);
      setNotice({ severity: "success", message: `Copied ${address}` });
    } catch {
      setNotice({
        severity: "error",
        message: `Couldn't copy — your page is at ${address}`,
      });
    }
  }

  function showTourStep(index: number) {
    const nextIndex = Math.max(0, Math.min(dashboardTour.length - 1, index));
    setTourStep(nextIndex);
    setSection(dashboardTour[nextIndex].section);
  }

  function finishTour() {
    window.localStorage.setItem(`cueful:dashboard-tour:${profile.id}`, "done");
    setTourOpen(false);
    if (draft.is_published) setSharePromptOpen(true);
  }

  function dismissSharePrompt() {
    window.localStorage.setItem(
      `cueful:share-prompt:${profile.id}`,
      "dismissed",
    );
    setSharePromptOpen(false);
  }

  async function saveLinks() {
    const cleaned = linkDraft
      .map((item) => ({ ...item, title: item.title.trim() }))
      .filter((item) => item.title || item.url.trim());

    if (cleaned.some((item) => !item.title)) {
      setNotice({ severity: "error", message: "Give every link a title." });
      return;
    }

    const normalized = cleaned.map((item) => ({
      ...item,
      url: normalizeHttpUrl(item.url),
    }));
    if (normalized.some((item) => !item.url)) {
      setNotice({ severity: "error", message: "Enter a valid URL for every link." });
      return;
    }

    setSavingLinks(true);
    const supabase = createClient();

    // Rows are updated in place and only the ones actually taken away are
    // deleted -- a delete-all-then-reinsert would drop every link's id, and
    // with it the analytics rows that reference them.
    const existing = new Set(links.map((item) => item.id));
    const kept = new Set(normalized.filter((item) => existing.has(item.id)).map((item) => item.id));
    const removed = links.filter((item) => !kept.has(item.id)).map((item) => item.id);

    if (removed.length) {
      const { error } = await supabase.from("links").delete().in("id", removed);
      if (error) {
        setSavingLinks(false);
        setNotice({ severity: "error", message: error.message });
        return;
      }
    }

    for (const [index, item] of normalized.entries()) {
      const row = {
        title: item.title,
        url: item.url as string,
        position: index,
        is_active: item.is_active,
        is_featured: item.is_featured,
        thumbnail_path: item.thumbnail_path,
      };
      const { error } = existing.has(item.id)
        ? await supabase.from("links").update(row).eq("id", item.id)
        : await supabase.from("links").insert({ ...row, user_id: profile.id });
      if (error) {
        setSavingLinks(false);
        setNotice({ severity: "error", message: error.message });
        return;
      }
    }

    // Safe to sweep only now that the new paths are the ones on record.
    const orphans = [...orphanedThumbnails.current];
    if (orphans.length) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove(orphans);
      orphanedThumbnails.current.clear();
    }

    setSavingLinks(false);
    setNotice({ severity: "success", message: "Your links have been updated." });
    router.refresh();
  }

  async function saveReferrals() {
    const cleaned = referralDraft.filter(
      (item) => item.provider.trim() || item.offer.trim() || item.url.trim(),
    );

    if (cleaned.some((item) => !item.provider.trim() || !item.offer.trim())) {
      setNotice({
        severity: "error",
        message: "Give every referral a provider and an offer.",
      });
      return;
    }

    const normalized = cleaned.map((item) => ({
      ...item,
      url: normalizeHttpUrl(item.url),
    }));
    if (normalized.some((item) => !item.url)) {
      setNotice({
        severity: "error",
        message: "Enter a valid URL for every referral offer.",
      });
      return;
    }

    setSavingReferrals(true);
    const supabase = createClient();

    const existing = new Set(referrals.map((item) => item.id));
    const kept = new Set(
      normalized.filter((item) => existing.has(item.id)).map((item) => item.id),
    );
    const removed = referrals
      .filter((item) => !kept.has(item.id))
      .map((item) => item.id);

    if (removed.length) {
      const { error } = await supabase.from("referrals").delete().in("id", removed);
      if (error) {
        setSavingReferrals(false);
        setNotice({ severity: "error", message: error.message });
        return;
      }
    }

    for (const [index, item] of normalized.entries()) {
      const row = {
        provider: item.provider.trim(),
        offer: item.offer.trim(),
        url: item.url as string,
        code: item.code.trim() || null,
        color: item.color,
        position: index,
        is_active: item.is_active,
      };
      const { error } = existing.has(item.id)
        ? await supabase.from("referrals").update(row).eq("id", item.id)
        : await supabase.from("referrals").insert({ ...row, user_id: profile.id });
      if (error) {
        setSavingReferrals(false);
        setNotice({ severity: "error", message: error.message });
        return;
      }
    }

    setSavingReferrals(false);
    setNotice({ severity: "success", message: "Your referrals have been updated." });
    router.refresh();
  }

  async function saveProfile() {
    if (canonicalError) {
      setNotice({ severity: "error", message: canonicalError });
      return;
    }
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
        tags: draft.tags
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 16),
        template: draft.template,
        theme_config: activeTheme,
        seo_title: draft.seo_title?.trim() || null,
        seo_description: draft.seo_description?.trim() || null,
        seo_og_title: draft.seo_og_title?.trim() || null,
        seo_og_description: draft.seo_og_description?.trim() || null,
        seo_keywords: draft.seo_keywords?.trim() || null,
        seo_noindex: draft.seo_noindex,
        twitter_card_style: draft.twitter_card_style || "summary_large_image",
        canonical_url: draft.canonical_url?.trim() || null,
        show_cueful_badge: draft.show_cueful_badge,
        is_discoverable: draft.is_discoverable,
        is_published: draft.is_published,
        disclosure_text: draft.disclosure_text?.trim() || null,
        job_title: draft.job_title?.trim() || null,
        company: draft.company?.trim() || null,
        contact_email: draft.contact_email?.trim() || null,
        contact_phone: draft.contact_phone?.trim() || null,
        show_save_contact: draft.show_save_contact,
        show_exchange: draft.show_exchange,
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

  async function uploadFavicon(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateFavicon(file);
    if (validationError) {
      setNotice({ severity: "error", message: validationError });
      return;
    }

    setFaviconUploading(true);
    const supabase = createClient();
    const path = `${profile.id}/seo/favicon-${crypto.randomUUID()}.${faviconExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_ASSET_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setFaviconUploading(false);
      setNotice({ severity: "error", message: uploadError.message });
      return;
    }

    const previousPath = draft.favicon_path;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ favicon_path: path })
      .eq("id", profile.id);

    if (profileError) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([path]);
      setFaviconUploading(false);
      setNotice({ severity: "error", message: profileError.message });
      return;
    }

    if (previousPath) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([previousPath]);
    }

    update("favicon_path", path);
    setFaviconUploading(false);
    setNotice({ severity: "success", message: "Favicon updated." });
    router.refresh();
  }

  async function removeFavicon() {
    if (!draft.favicon_path) return;

    setFaviconUploading(true);
    const supabase = createClient();
    const previousPath = draft.favicon_path;
    const { error } = await supabase
      .from("profiles")
      .update({ favicon_path: null })
      .eq("id", profile.id);

    if (error) {
      setFaviconUploading(false);
      setNotice({ severity: "error", message: error.message });
      return;
    }

    await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([previousPath]);
    update("favicon_path", null);
    setFaviconUploading(false);
    setNotice({ severity: "success", message: "Favicon removed." });
    router.refresh();
  }

  async function uploadBrandAsset(
    kind: "logo" | "wallpaper",
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setNotice({ severity: "error", message: validationError });
      return;
    }

    setBrandingUploading(kind);
    const supabase = createClient();
    const folder = kind === "logo" ? "branding" : "wallpapers";
    const path = `${profile.id}/${folder}/${kind}-${crypto.randomUUID()}.${imageExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_ASSET_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setBrandingUploading(null);
      setNotice({ severity: "error", message: uploadError.message });
      return;
    }

    const previousPath =
      kind === "logo" ? activeTheme.logoPath : activeTheme.wallpaperPath;
    const nextTheme: ProfileThemeConfig = {
      ...activeTheme,
      ...(kind === "logo"
        ? { logoPath: path }
        : { wallpaperPath: path }),
    };
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ theme_config: nextTheme })
      .eq("id", profile.id);

    if (profileError) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([path]);
      setBrandingUploading(null);
      setNotice({ severity: "error", message: profileError.message });
      return;
    }

    if (previousPath) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([previousPath]);
    }

    updateTheme(() => nextTheme);
    setBrandingUploading(null);
    setNotice({
      severity: "success",
      message: kind === "logo" ? "Brand logo updated." : "Wallpaper updated.",
    });
    router.refresh();
  }

  async function removeBrandAsset(kind: "logo" | "wallpaper") {
    const previousPath =
      kind === "logo" ? activeTheme.logoPath : activeTheme.wallpaperPath;
    if (!previousPath) return;

    setBrandingUploading(kind);
    const supabase = createClient();
    const nextTheme: ProfileThemeConfig = {
      ...activeTheme,
      ...(kind === "logo" ? { logoPath: null } : { wallpaperPath: null }),
    };
    const { error } = await supabase
      .from("profiles")
      .update({ theme_config: nextTheme })
      .eq("id", profile.id);

    if (error) {
      setBrandingUploading(null);
      setNotice({ severity: "error", message: error.message });
      return;
    }

    await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([previousPath]);
    updateTheme(() => nextTheme);
    setBrandingUploading(null);
    setNotice({
      severity: "success",
      message: kind === "logo" ? "Brand logo removed." : "Wallpaper removed.",
    });
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  function jumpToSettings(id: SettingsJumpId) {
    setSection("account");
    setSettingsJump(id);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 40);
  }

  async function downloadAccountData() {
    setExportingData(true);
    try {
      const response = await fetch("/api/account/export");
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Could not export your data.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${draft.username || "cueful"}-cueful-export.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice({
        severity: "success",
        message: "Your Cueful data download started.",
      });
    } catch (error) {
      setNotice({
        severity: "error",
        message:
          error instanceof Error ? error.message : "Could not export your data.",
      });
    } finally {
      setExportingData(false);
    }
  }

  async function deleteAccount() {
    setDeletingAccount(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not delete this account.");
      }
      router.push("/auth");
      router.refresh();
    } catch (error) {
      setDeletingAccount(false);
      setNotice({
        severity: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not delete this account.",
      });
    }
  }

  return (
    <main
      className={`workspace-shell ${
        mobileMode === "preview" ? "is-mobile-preview" : "is-mobile-edit"
      }`}
    >
      <header className="workspace-mobile-header">
        <div>
          <BrandMark className="workspace-mobile-brand" />
          <span>{publicProfileAddress(draft.username || "username")}</span>
        </div>
        {/* On a phone this is the button you press standing in front of
            someone, so it goes to the code rather than the asset kit. The
            Share Kit is still one tap away under Settings → QR & page
            sharing, where you'd look for a poster anyway. */}
        <Button
          component={Link}
          href="/card"
          variant="contained"
          startIcon={<QrCode2Rounded />}
          disabled={!draft.is_published}
        >
          My card
        </Button>
      </header>

      {!["more", "highlights", "health", "account"].includes(section) && (
      <div className="workspace-mobile-tools">
        <div className="workspace-mobile-mode" aria-label="Dashboard mode">
          <ButtonBase
            className={mobileMode === "edit" ? "is-active" : ""}
            onClick={() => setMobileMode("edit")}
            aria-pressed={mobileMode === "edit"}
          >
            <EditRounded />
            Edit
          </ButtonBase>
          <ButtonBase
            className={mobileMode === "preview" ? "is-active" : ""}
            onClick={() => setMobileMode("preview")}
            aria-pressed={mobileMode === "preview"}
          >
            <VisibilityOutlined />
            Preview
          </ButtonBase>
        </div>

        {mobileMode === "edit" ? (
          <Paper className="workspace-mobile-page-card" variant="outlined">
            <div>
              <span>MAIN PAGE</span>
              <b>@{draft.username || "username"}</b>
              <small>Public profile</small>
            </div>
            <div className="workspace-mobile-page-card__actions">
              <Button
                color="inherit"
                onClick={() => setSection("account")}
              >
                Account
              </Button>
              <Button
                variant="contained"
                onClick={saveProfile}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : undefined}
              >
                {saving ? "Saving" : "Save"}
              </Button>
            </div>
          </Paper>
        ) : (
          <Button
            className="workspace-mobile-live-link"
            component={Link}
            href={publicProfilePath(draft.username)}
            target="_blank"
            variant="outlined"
            startIcon={<ArrowOutwardRounded />}
          >
            Open live page
          </Button>
        )}
      </div>
      )}

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
        <Tooltip title="Show dashboard tour" placement="right" arrow>
          <IconButton
            className="workspace-rail__help"
            aria-label="Show dashboard tour"
            onClick={() => {
              setTourOpen(true);
              showTourStep(0);
            }}
          >
            <HelpOutlineRounded />
          </IconButton>
        </Tooltip>
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
                onClick={copyPublicPage}
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
                    href={publicProfilePath(draft.username)}
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

        <div className="workspace-editor__scroll" ref={editorScrollRef}>
          <div className="workspace-mobile-section-heading">
            <Typography className="section-label">
              {sectionDetails.eyebrow}
            </Typography>
            <Typography component="h1" variant="h2">
              {sectionDetails.title}
            </Typography>
            <Typography color="text.secondary">
              {sectionDetails.body}
            </Typography>
          </div>

          {(section === "profile" || section === "appearance") && (
            <div className="workspace-mobile-design-tabs" aria-label="Design settings">
              <ButtonBase
                className={section === "profile" ? "is-active" : ""}
                onClick={() => setSection("profile")}
              >
                Profile
              </ButtonBase>
              <ButtonBase
                className={section === "appearance" ? "is-active" : ""}
                onClick={() => setSection("appearance")}
              >
                Theme
              </ButtonBase>
            </div>
          )}

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
              {/* Shows the raw text while focused rather than the parsed array
                  joined back together. Rendering the join meant the separator
                  the user had just typed was parsed away and never made it back
                  into the field -- "AWS," became "AWS" on the same keystroke, so
                  a second tag could not be started. On blur the local copy is
                  dropped and the canonical join takes over again. */}
              <TextField
                label="Skill tags"
                value={tagsText ?? draft.tags.join(", ")}
                onChange={(event) => {
                  setTagsText(event.target.value);
                  update("tags", parseTags(event.target.value));
                }}
                onBlur={() => setTagsText(null)}
                helperText="Comma-separated chips under your intro (AWS, DevOps, Design…)"
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
                <SeoPreview
                  title={seoPreviewTitle}
                  description={seoPreviewDescription}
                  username={draft.username}
                  imageUrl={seoPreviewImage}
                />
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
                <div className="workspace-favicon-row">
                  <span className="workspace-favicon-row__preview">
                    {draft.favicon_path ? (
                      <Box
                        component="img"
                        src={publicAssetUrl(draft.favicon_path)}
                        alt="Current favicon"
                      />
                    ) : (
                      <LanguageRounded />
                    )}
                  </span>
                  <Box>
                    <Typography fontWeight={850}>Custom favicon</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Square PNG or ICO, 64×64 recommended. Shows in browser tabs
                      for your public page.
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
                      <Button
                        component="label"
                        variant="outlined"
                        disabled={faviconUploading}
                        startIcon={
                          faviconUploading
                            ? <CircularProgress size={16} />
                            : <LanguageRounded />
                        }
                      >
                        {draft.favicon_path ? "Replace favicon" : "Upload favicon"}
                        <input
                          hidden
                          type="file"
                          accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp,.ico"
                          onChange={uploadFavicon}
                        />
                      </Button>
                      {draft.favicon_path && (
                        <Button
                          color="inherit"
                          disabled={faviconUploading}
                          onClick={removeFavicon}
                        >
                          Remove
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </div>
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

          {section === "connections" && (
            <Stack className="workspace-panel" spacing={2}>
              <ConnectionsInbox
                profileId={profile.id}
                initialConnections={connections}
                initialEventTag={profile.current_event_tag ?? ""}
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
                  variant="contained"
                  disabled={savingLinks}
                  onClick={saveLinks}
                  startIcon={<InsertLinkRounded />}
                >
                  {savingLinks ? "Saving…" : "Save links"}
                </Button>
              </div>
              <div className="workspace-content-list">
                <LinksEditor
                  value={linkDraft}
                  onChange={setLinkDraft}
                  userId={profile.id}
                  // The dashboard's banner carries success/error only; the
                  // editor's "warning" cases are completed actions, not faults.
                  onNotice={(notice) =>
                    setNotice({
                      severity: notice.severity === "error" ? "error" : "success",
                      message: notice.message,
                    })
                  }
                  onThumbnailOrphaned={(path) =>
                    orphanedThumbnails.current.add(path)
                  }
                />
              </div>

              <div className="workspace-panel__heading workspace-panel__heading--referrals">
                <Box>
                  <Typography variant="h3">Referral offers</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Codes and perks your audience can use
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  disabled={savingReferrals}
                  onClick={saveReferrals}
                  startIcon={<LocalOfferOutlined />}
                >
                  {savingReferrals ? "Saving…" : "Save referrals"}
                </Button>
              </div>
              <div className="workspace-referral-grid workspace-referral-grid--editing">
                <ReferralsEditor
                  value={referralDraft}
                  onChange={setReferralDraft}
                />
              </div>

              <FaqEditor profileId={profile.id} initialFaqs={faqs} />
            </Stack>
          )}

          {section === "commerce" && (
            <Stack className="workspace-panel workspace-panel--commerce" spacing={3}>
              <CommerceMediaEditor
                profileId={profile.id}
                initialProducts={products}
                initialMedia={mediaEmbeds}
              />
              <Paper className="commerce-disclosure" variant="outlined">
                <Box>
                  <Typography className="section-label">TRUST & DISCLOSURE</Typography>
                  <Typography variant="h3">Say when a link may earn money</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Keep this short and plain. It appears beneath your public content.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {[
                    {
                      label: "Affiliate",
                      text: "Some links on this page are affiliate links. I may earn a commission at no extra cost to you.",
                    },
                    {
                      label: "Amazon",
                      text: "As an Amazon Associate I earn from qualifying purchases.",
                    },
                    {
                      label: "Sponsored",
                      text: "This page contains paid partnerships or sponsored content.",
                    },
                  ].map((preset) => (
                    <Button
                      size="small"
                      variant="outlined"
                      key={preset.label}
                      onClick={() => update("disclosure_text", preset.text)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                  {draft.disclosure_text && (
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => update("disclosure_text", null)}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
                <TextField
                  label="Disclosure"
                  value={draft.disclosure_text ?? ""}
                  onChange={(event) =>
                    update("disclosure_text", event.target.value.slice(0, 320))
                  }
                  multiline
                  minRows={3}
                  helperText={`${draft.disclosure_text?.length ?? 0}/320 · Saved when you select Update`}
                />
              </Paper>
            </Stack>
          )}

          {section === "appearance" && (
            <Stack className="workspace-panel" spacing={3}>
              <div className="workspace-design-group">
                <div className="workspace-design-heading">
                  <Box>
                    <Typography variant="h3">Start with a layout</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choosing a layout resets the controls below to a matching direction.
                    </Typography>
                  </Box>
                  <Chip label="LIVE PREVIEW" size="small" variant="outlined" />
                </div>
                <div className="workspace-template-grid">
                  {templateOptions.map((template) => (
                    <ButtonBase
                      className={`workspace-template-card ${
                        draft.template === template.id ? "is-selected" : ""
                      }`}
                      onClick={() => selectTemplate(template.id)}
                      aria-label={`Use ${template.name} layout`}
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
                          {draft.template === template.id ? "Selected" : "Use layout"}
                        </small>
                      </span>
                      {draft.template === template.id && <CheckCircleRounded />}
                    </ButtonBase>
                  ))}
                </div>
              </div>

              <div className="workspace-design-group">
                <div className="workspace-design-heading">
                  <Box>
                    <Typography variant="h3">Color direction</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Curated combinations with accessible text contrast.
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-palette-grid">
                  {themePalettes.map((palette) => {
                    const selected =
                      palette.colors.background === activeTheme.colors.background &&
                      palette.colors.accent === activeTheme.colors.accent &&
                      palette.colors.button === activeTheme.colors.button;
                    return (
                      <ButtonBase
                        className={`workspace-palette${selected ? " is-selected" : ""}`}
                        onClick={() =>
                          updateTheme((current) => ({
                            ...current,
                            colors: { ...palette.colors },
                          }))
                        }
                        aria-label={`Use ${palette.name} colors`}
                        key={palette.id}
                      >
                        <span className="workspace-palette__swatches">
                          <i style={{ background: palette.colors.background }} />
                          <i style={{ background: palette.colors.surface }} />
                          <i style={{ background: palette.colors.accent }} />
                          <i style={{ background: palette.colors.button }} />
                        </span>
                        <span>
                          <b>{palette.name}</b>
                          <small>{palette.note}</small>
                        </span>
                      </ButtonBase>
                    );
                  })}
                </div>
              </div>

              <details className="workspace-color-details">
                <summary>Fine-tune individual colors</summary>
                <div className="workspace-color-grid">
                  {themeColorFields.map((field) => (
                    <label className="workspace-color-control" key={field.key}>
                      <span>{field.label}</span>
                      <span>
                        <input
                          type="color"
                          value={activeTheme.colors[field.key]}
                          onChange={(event) =>
                            updateTheme((current) => ({
                              ...current,
                              colors: {
                                ...current.colors,
                                [field.key]: event.target.value,
                              },
                            }))
                          }
                          aria-label={`${field.label} color`}
                        />
                        <code>{activeTheme.colors[field.key]}</code>
                      </span>
                    </label>
                  ))}
                </div>
              </details>

              <div className="workspace-design-group">
                <div className="workspace-design-heading">
                  <Box>
                    <Typography variant="h3">Type pairing</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Headline personality without sacrificing readable body copy.
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-choice-grid workspace-choice-grid--fonts">
                  {themeFontOptions.map((font) => (
                    <ButtonBase
                      className={`workspace-type-choice workspace-type-choice--${font.id} ${
                        activeTheme.font === font.id ? "is-selected" : ""
                      }`}
                      onClick={() =>
                        updateTheme((current) => ({ ...current, font: font.id }))
                      }
                      aria-label={`Use ${font.name} type pairing`}
                      key={font.id}
                    >
                      <b>{font.sample}</b>
                      <small>{font.name}</small>
                    </ButtonBase>
                  ))}
                </div>
              </div>

              <div className="workspace-design-split">
                <div className="workspace-design-group">
                  <Typography variant="h3">Button shape</Typography>
                  <div className="workspace-segmented">
                    {(["soft", "pill", "sharp", "glass", "outline"] as const).map(
                      (shape) => (
                      <ButtonBase
                        className={activeTheme.buttonShape === shape ? "is-selected" : ""}
                        onClick={() =>
                          updateTheme((current) => ({
                            ...current,
                            buttonShape: shape,
                          }))
                        }
                        key={shape}
                      >
                        {shape}
                      </ButtonBase>
                    ))}
                  </div>
                </div>
                <div className="workspace-design-group">
                  <Typography variant="h3">Spacing</Typography>
                  <div className="workspace-segmented">
                    {(["relaxed", "compact"] as const).map((density) => (
                      <ButtonBase
                        className={activeTheme.density === density ? "is-selected" : ""}
                        onClick={() =>
                          updateTheme((current) => ({ ...current, density }))
                        }
                        key={density}
                      >
                        {density}
                      </ButtonBase>
                    ))}
                  </div>
                </div>
              </div>

              <div className="workspace-design-group">
                <div className="workspace-design-heading">
                  <Box>
                    <Typography variant="h3">Wallpapers</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Prism, graph, flare, and other textures — or upload your own full-bleed image.
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-choice-grid workspace-choice-grid--wallpapers">
                  {themeBackgroundOptions.map((background) => (
                    <ButtonBase
                      className={`workspace-background-choice workspace-background-choice--${background.id} ${
                        activeTheme.background === background.id
                          ? "is-selected"
                          : ""
                      }`}
                      onClick={() =>
                        updateTheme((current) => {
                          const blockPalettes: Record<
                            string,
                            (typeof themePalettes)[number]["colors"]
                          > = {
                            ink: themePalettes.find((p) => p.id === "charcoal-block")!
                              .colors,
                            lagoon: themePalettes.find((p) => p.id === "teal-block")!
                              .colors,
                            lilac: themePalettes.find((p) => p.id === "lavender-block")!
                              .colors,
                          };
                          const colors = blockPalettes[background.id];
                          return {
                            ...current,
                            background: background.id,
                            ...(colors ? { colors: { ...colors } } : {}),
                          };
                        })
                      }
                      key={background.id}
                    >
                      <i
                        style={
                          {
                            "--choice-bg": activeTheme.colors.background,
                            "--choice-accent": activeTheme.colors.accent,
                          } as React.CSSProperties
                        }
                      />
                      <span>
                        <b>{background.name}</b>
                        <small>{background.note}</small>
                      </span>
                    </ButtonBase>
                  ))}
                </div>
                <div className="workspace-branding-row">
                  <span className="workspace-branding-row__preview workspace-branding-row__preview--wallpaper">
                    {wallpaperUrl ? (
                      <Box component="img" src={wallpaperUrl} alt="" />
                    ) : (
                      <Typography variant="caption">Custom wallpaper</Typography>
                    )}
                  </span>
                  <Box>
                    <Typography fontWeight={850}>Your wallpaper</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Optional image layered behind your page. JPG, PNG, or WebP.
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                      sx={{ mt: 1.25 }}
                    >
                      <Button
                        component="label"
                        variant="outlined"
                        disabled={brandingUploading !== null}
                        startIcon={
                          brandingUploading === "wallpaper" ? (
                            <CircularProgress size={16} />
                          ) : (
                            <PhotoCameraOutlined />
                          )
                        }
                      >
                        {wallpaperUrl ? "Replace wallpaper" : "Upload wallpaper"}
                        <input
                          hidden
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) =>
                            uploadBrandAsset("wallpaper", event)
                          }
                        />
                      </Button>
                      {wallpaperUrl && (
                        <Button
                          color="inherit"
                          disabled={brandingUploading !== null}
                          onClick={() => removeBrandAsset("wallpaper")}
                        >
                          Remove
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </div>
                <div className="workspace-design-group" style={{ marginTop: 18 }}>
                  <Typography variant="h3">Contact form</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.25 }}
                  >
                    Let visitors send you a name, email, and message from your page.
                  </Typography>
                  <div className="workspace-segmented">
                    {([true, false] as const).map((enabled) => (
                      <ButtonBase
                        className={
                          Boolean(activeTheme.contactForm) === enabled
                            ? "is-selected"
                            : ""
                        }
                        onClick={() =>
                          updateTheme((current) => ({
                            ...current,
                            contactForm: enabled,
                          }))
                        }
                        key={String(enabled)}
                      >
                        {enabled ? "On" : "Off"}
                      </ButtonBase>
                    ))}
                  </div>
                </div>
              </div>

              <div className="workspace-design-group">
                <div className="workspace-design-heading">
                  <Box>
                    <Typography variant="h3">Your branding</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add a logo mark that sits above your photo and intro.
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-branding-row">
                  <span className="workspace-branding-row__preview">
                    {brandingLogoUrl ? (
                      <Box component="img" src={brandingLogoUrl} alt="" />
                    ) : (
                      <Typography variant="caption">Logo</Typography>
                    )}
                  </span>
                  <Box>
                    <Typography fontWeight={850}>Brand logo</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Transparent PNG works best. Keep it under 5 MB.
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                      sx={{ mt: 1.25 }}
                    >
                      <Button
                        component="label"
                        variant="outlined"
                        disabled={brandingUploading !== null}
                        startIcon={
                          brandingUploading === "logo" ? (
                            <CircularProgress size={16} />
                          ) : (
                            <PhotoCameraOutlined />
                          )
                        }
                      >
                        {brandingLogoUrl ? "Replace logo" : "Upload logo"}
                        <input
                          hidden
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => uploadBrandAsset("logo", event)}
                        />
                      </Button>
                      {brandingLogoUrl && (
                        <Button
                          color="inherit"
                          disabled={brandingUploading !== null}
                          onClick={() => removeBrandAsset("logo")}
                        >
                          Remove
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </div>
              </div>

              <Alert severity="info" variant="outlined">
                Every appearance control is included. Saving changes updates the
                public page without changing its URL or content.
              </Alert>
            </Stack>
          )}

          {section === "analytics" && (
            <div className="workspace-analytics">
              <div className="workspace-analytics__toolbar">
                <Box>
                  <Typography variant="h3">Performance overview</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Visits are anonymous. Location is shown only at country level.
                  </Typography>
                </Box>
                <div className="workspace-segmented" aria-label="Analytics date range">
                  {([
                    ["7d", "7 days"],
                    ["30d", "30 days"],
                    ["all", "All time"],
                  ] as const).map(([range, label]) => (
                    <ButtonBase
                      className={analyticsRange === range ? "is-selected" : ""}
                      onClick={() => {
                        setAnalyticsRange(range);
                        setAnalyticsBucket(6);
                      }}
                      aria-pressed={analyticsRange === range}
                      key={range}
                    >
                      {label}
                    </ButtonBase>
                  ))}
                </div>
              </div>
              <StatCard
                label="PROFILE VIEWS"
                value={analytics.views}
                note={analytics.rangeLabel}
              />
              <StatCard
                label="OUTBOUND CLICKS"
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
                      Visits recorded during {analytics.rangeLabel.toLowerCase()}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${analytics.views} VISIT${analytics.views === 1 ? "" : "S"}`}
                    size="small"
                    variant="outlined"
                  />
                </div>
                <div className="workspace-analytics__bars" aria-label="Profile view trend">
                  {analytics.days.map((day, index) => {
                    const maximum = Math.max(
                      1,
                      ...analytics.days.map((item) => item.value),
                    );
                    return (
                      <ButtonBase
                        className={analyticsBucket === index ? "is-selected" : ""}
                        onClick={() => setAnalyticsBucket(index)}
                        aria-label={`${day.periodLabel}: ${day.value} views and ${day.clicks} clicks`}
                        aria-pressed={analyticsBucket === index}
                        key={day.key}
                      >
                        <span>{day.value}</span>
                        <i
                          style={{
                            height: `${Math.max(4, (day.value / maximum) * 100)}%`,
                          }}
                        />
                        <small>{day.label}</small>
                      </ButtonBase>
                    );
                  })}
                </div>
                {selectedAnalyticsPeriod && (
                  <div className="workspace-analytics__period">
                    <div>
                      <span>SELECTED PERIOD</span>
                      <b>{selectedAnalyticsPeriod.periodLabel}</b>
                    </div>
                    <div>
                      <small>CTR</small>
                      <strong>
                        {selectedAnalyticsPeriod.value
                          ? Math.min(
                              100,
                              Math.round(
                                (selectedAnalyticsPeriod.clicks /
                                  selectedAnalyticsPeriod.value) *
                                  100,
                              ),
                            )
                          : 0}
                        %
                      </strong>
                    </div>
                    <span>
                      <small>Page views</small>
                      <b>{selectedAnalyticsPeriod.value}</b>
                    </span>
                    <span>
                      <small>Outbound clicks</small>
                      <b>{selectedAnalyticsPeriod.clicks}</b>
                    </span>
                  </div>
                )}
              </Paper>

              <Paper className="workspace-analytics__funnel" variant="outlined">
                <div className="workspace-analytics__card-heading">
                  <Box>
                    <Typography variant="h3">Attention funnel</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Where visitors continue—and where they stop
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-funnel">
                  {[
                    { label: "Profile views", value: analytics.views },
                    { label: "Outbound clicks", value: analytics.outboundClicks },
                    { label: "Referral opens", value: analytics.referralOpens },
                    { label: "Code copies", value: analytics.referralCopies },
                  ].map((stage) => {
                    const share =
                      analytics.views > 0
                        ? Math.min(100, Math.round((stage.value / analytics.views) * 100))
                        : 0;
                    return (
                      <div key={stage.label}>
                        <span>
                          <b>{stage.label}</b>
                          <small>{stage.value} · {share}% of visits</small>
                        </span>
                        <i><em style={{ width: `${share}%` }} /></i>
                      </div>
                    );
                  })}
                </div>
              </Paper>

              <Paper className="workspace-analytics__map-card" variant="outlined">
                <div className="workspace-analytics__card-heading">
                  <Box>
                    <Typography variant="h3">Where visits come from</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Approximate country signals, never precise locations
                    </Typography>
                  </Box>
                  <Chip
                    label={analytics.topCountry === "—" ? "NO DATA YET" : analytics.topCountry}
                    size="small"
                    variant="outlined"
                  />
                </div>
                <AudienceMap countries={analytics.countries} />
                <div className="workspace-country-list">
                  {analytics.countries.slice(0, 5).map((country) => (
                    <div key={country.code}>
                      <span><b>{country.name}</b><small>{country.count} visits</small></span>
                      <i><em style={{ width: `${country.share}%` }} /></i>
                      <strong>{country.share}%</strong>
                    </div>
                  ))}
                  {analytics.countries.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Country rankings will appear after your public page receives
                      visits with an available country signal.
                    </Typography>
                  )}
                </div>
              </Paper>

              <Paper className="workspace-analytics__traffic" variant="outlined">
                <div className="workspace-analytics__card-heading">
                  <Box>
                    <Typography variant="h3">Traffic mix</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sources and devices behind your visits
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-traffic-columns">
                  <section>
                    <Typography className="section-label">SOURCES</Typography>
                    {(analytics.sources.length
                      ? analytics.sources.slice(0, 5)
                      : [{ label: "No source data", count: 0, share: 0 }]
                    ).map((item) => (
                      <div className="workspace-breakdown-row" key={item.label}>
                        <span><b>{item.label}</b><small>{item.count} visits</small></span>
                        <i><em style={{ width: `${item.share}%` }} /></i>
                        <strong>{item.share}%</strong>
                      </div>
                    ))}
                  </section>
                  <section>
                    <Typography className="section-label">DEVICES</Typography>
                    {(analytics.devices.length
                      ? analytics.devices.slice(0, 5)
                      : [{ label: "No device data", count: 0, share: 0 }]
                    ).map((item) => (
                      <div className="workspace-breakdown-row" key={item.label}>
                        <span><b>{item.label}</b><small>{item.count} visits</small></span>
                        <i><em style={{ width: `${item.share}%` }} /></i>
                        <strong>{item.share}%</strong>
                      </div>
                    ))}
                  </section>
                </div>
              </Paper>

              <Paper className="workspace-analytics__ranking" variant="outlined">
                <div className="workspace-analytics__card-heading">
                  <Box>
                    <Typography variant="h3">Content performance</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Opens and high-intent referral code copies
                    </Typography>
                  </Box>
                  <Chip label={analytics.topReferrer} size="small" variant="outlined" />
                </div>
                {analytics.topContent.length > 0 ? (
                  <ol>
                    {analytics.topContent.map((item, index) => (
                      <li key={`${item.type}-${item.label}`}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span>
                          <b>{item.label}</b>
                          <small>{item.type} · {item.opens} opens · {item.copies} copies</small>
                        </span>
                        <strong>{item.opens + item.copies} actions</strong>
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

          {section === "more" && (
            <div className="workspace-more">
              <Typography className="section-label">CREATE & MAINTAIN</Typography>
              <div className="workspace-more__list">
                <ButtonBase onClick={() => setSection("commerce")}>
                  <span className="workspace-more__icon workspace-more__icon--highlight">
                    <StorefrontOutlined />
                  </span>
                  <span>
                    <b>Shop & media</b>
                    <small>Product cards, music, and video</small>
                  </span>
                  <ChevronRightRounded />
                </ButtonBase>
                <ButtonBase onClick={() => setSection("highlights")}>
                  <span className="workspace-more__icon workspace-more__icon--highlight">
                    <StarOutlineRounded />
                  </span>
                  <span>
                    <b>Highlights</b>
                    <small>24-hour visual updates</small>
                  </span>
                  <ChevronRightRounded />
                </ButtonBase>
                <ButtonBase onClick={() => setSection("health")}>
                  <span className="workspace-more__icon workspace-more__icon--health">
                    <FavoriteBorderRounded />
                  </span>
                  <span>
                    <b>Link health</b>
                    <small>Find links that stopped responding</small>
                  </span>
                  <ChevronRightRounded />
                </ButtonBase>
                <ButtonBase
                  onClick={() => {
                    setTourOpen(true);
                    showTourStep(0);
                  }}
                >
                  <span className="workspace-more__icon workspace-more__icon--guide">
                    <HelpOutlineRounded />
                  </span>
                  <span>
                    <b>Dashboard guide</b>
                    <small>Replay the optional walkthrough</small>
                  </span>
                  <ChevronRightRounded />
                </ButtonBase>
              </div>
              <Typography className="section-label">ACCOUNT</Typography>
              <div className="workspace-more__list">
                <ButtonBase onClick={() => setSection("account")}>
                  <span className="workspace-more__icon workspace-more__icon--account">
                    <SettingsOutlined />
                  </span>
                  <span>
                    <b>Settings</b>
                    <small>Profile, SEO, sharing, privacy, and sign-in</small>
                  </span>
                  <ChevronRightRounded />
                </ButtonBase>
              </div>
              <Button
                className="workspace-more__logout"
                color="error"
                variant="outlined"
                startIcon={<LogoutRounded />}
                onClick={signOut}
              >
                Log out
              </Button>
            </div>
          )}

          {section === "highlights" && (
            <HighlightsEditor
              profileId={profile.id}
              initialHighlights={highlights}
            />
          )}

          {section === "health" && <LinkHealthScanner />}

          {section === "account" && (
            <Stack className="workspace-panel workspace-settings-basic" spacing={2}>
              <SettingsJumpNav
                activeId={settingsJump}
                onJump={jumpToSettings}
              />

              <Paper
                id="settings-profile"
                className="workspace-settings-card"
                variant="outlined"
              >
                <div className="workspace-settings-card__heading">
                  <PersonOutlineRounded />
                  <Box>
                    <Typography variant="h3">Profile</Typography>
                    <Typography variant="body2" color="text.secondary">
                      The basic identity attached to this Cueful page.
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-settings-card__fields">
                  <TextField
                    label="Display name"
                    value={draft.display_name}
                    onChange={(event) =>
                      update("display_name", event.target.value.slice(0, 80))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Username"
                    value={draft.username}
                    helperText={`Public URL: ${publicProfileAddress(draft.username)}`}
                    fullWidth
                    disabled
                  />
                  <TextField
                    label="Account email"
                    value={email}
                    helperText="Signed in and verified by Supabase."
                    fullWidth
                    disabled
                  />
                </div>
              </Paper>

              <Paper
                id="settings-card"
                className="workspace-settings-card"
                variant="outlined"
              >
                <div className="workspace-settings-card__heading">
                  <BadgeOutlined />
                  <Box>
                    <Typography variant="h3">Contact card</Typography>
                    <Typography variant="body2" color="text.secondary">
                      What lands in someone’s phone when they save your contact.
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-settings-card__fields">
                  <TextField
                    label="Job title"
                    value={draft.job_title ?? ""}
                    onChange={(event) =>
                      update("job_title", event.target.value.slice(0, 80))
                    }
                    placeholder="Account Executive"
                    fullWidth
                  />
                  <TextField
                    label="Company"
                    value={draft.company ?? ""}
                    onChange={(event) =>
                      update("company", event.target.value.slice(0, 80))
                    }
                    placeholder="Northwind"
                    fullWidth
                  />
                  <TextField
                    label="Contact email"
                    type="email"
                    value={draft.contact_email ?? ""}
                    onChange={(event) =>
                      update("contact_email", event.target.value.slice(0, 254))
                    }
                    helperText="Shown on your card. Can differ from your sign-in email."
                    fullWidth
                  />
                  <TextField
                    label="Phone"
                    value={draft.contact_phone ?? ""}
                    onChange={(event) =>
                      update("contact_phone", event.target.value.slice(0, 32))
                    }
                    placeholder="+1 555 000 1234"
                    fullWidth
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={draft.show_save_contact}
                        onChange={(event) =>
                          update("show_save_contact", event.target.checked)
                        }
                      />
                    }
                    label="Show “Save my contact” on my page"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={draft.show_exchange}
                        onChange={(event) =>
                          update("show_exchange", event.target.checked)
                        }
                      />
                    }
                    label="Let people send their details back to me"
                  />
                </div>
              </Paper>

              <Paper
                id="settings-seo"
                className="workspace-settings-card"
                variant="outlined"
              >
                <div className="workspace-settings-card__heading">
                  <SearchRounded />
                  <Box>
                    <Typography variant="h3">SEO & branding</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Search and social preview settings.
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-settings-card__fields">
                  <SeoPreview
                    title={seoPreviewTitle}
                    description={seoPreviewDescription}
                    socialTitle={seoSocialTitle}
                    socialDescription={seoSocialDescription}
                    username={draft.username}
                    imageUrl={seoPreviewImage}
                  />
                  <TextField
                    label="Page title"
                    value={draft.seo_title ?? ""}
                    onChange={(event) =>
                      update("seo_title", event.target.value.slice(0, 70))
                    }
                    placeholder={`${draft.display_name} — links and recommendations`}
                    helperText={`${draft.seo_title?.length ?? 0}/70`}
                    fullWidth
                  />
                  <TextField
                    label="Meta description"
                    value={draft.seo_description ?? ""}
                    onChange={(event) =>
                      update("seo_description", event.target.value.slice(0, 170))
                    }
                    placeholder={draft.bio || "A clear summary of this public page."}
                    helperText={`${draft.seo_description?.length ?? 0}/170`}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                  <div className="workspace-favicon-row">
                    <span className="workspace-favicon-row__preview">
                      {draft.favicon_path ? (
                        <Box
                          component="img"
                          src={publicAssetUrl(draft.favicon_path)}
                          alt="Current favicon"
                        />
                      ) : (
                        <LanguageRounded />
                      )}
                    </span>
                    <Box>
                      <Typography fontWeight={850}>Custom favicon</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Square PNG or ICO, 64×64 recommended. Shows in browser tabs
                        for your public page.
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mt: 1.25 }}
                      >
                        <Button
                          component="label"
                          variant="outlined"
                          disabled={faviconUploading}
                          startIcon={
                            faviconUploading
                              ? <CircularProgress size={16} />
                              : <LanguageRounded />
                          }
                        >
                          {draft.favicon_path ? "Replace favicon" : "Upload favicon"}
                          <input
                            hidden
                            type="file"
                            accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/jpeg,image/webp,.ico"
                            onChange={uploadFavicon}
                          />
                        </Button>
                        {draft.favicon_path && (
                          <Button
                            color="inherit"
                            disabled={faviconUploading}
                            onClick={removeFavicon}
                          >
                            Remove
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </div>

                  <Typography variant="h3" sx={{ pt: 1 }}>
                    Advanced social SEO
                  </Typography>
                  <TextField
                    label="Open Graph title"
                    value={draft.seo_og_title ?? ""}
                    onChange={(event) =>
                      update("seo_og_title", event.target.value.slice(0, 70))
                    }
                    placeholder={seoPreviewTitle}
                    helperText={`${draft.seo_og_title?.length ?? 0}/70 · Leave blank to reuse page title`}
                    fullWidth
                  />
                  <TextField
                    select
                    label="Twitter card style"
                    value={draft.twitter_card_style || "summary_large_image"}
                    onChange={(event) =>
                      update(
                        "twitter_card_style",
                        event.target.value as DashboardProfile["twitter_card_style"],
                      )
                    }
                    fullWidth
                  >
                    <MenuItem value="summary_large_image">Large image</MenuItem>
                    <MenuItem value="summary">Summary</MenuItem>
                  </TextField>
                  <TextField
                    label="Open Graph description"
                    value={draft.seo_og_description ?? ""}
                    onChange={(event) =>
                      update(
                        "seo_og_description",
                        event.target.value.slice(0, 170),
                      )
                    }
                    placeholder={seoPreviewDescription}
                    helperText={`${draft.seo_og_description?.length ?? 0}/170 · Leave blank to reuse meta description`}
                    multiline
                    minRows={3}
                    fullWidth
                  />
                  <TextField
                    label="Keywords (comma separated)"
                    value={draft.seo_keywords ?? ""}
                    onChange={(event) =>
                      update("seo_keywords", event.target.value.slice(0, 240))
                    }
                    placeholder="creator, portfolio, links"
                    helperText={`${draft.seo_keywords?.length ?? 0}/240`}
                    fullWidth
                  />
                  <TextField
                    label="Canonical URL"
                    value={draft.canonical_url ?? ""}
                    onChange={(event) =>
                      update("canonical_url", event.target.value)
                    }
                    placeholder={`${BRAND_URL}${publicProfilePath(draft.username)}`}
                    error={Boolean(canonicalError)}
                    helperText={
                      canonicalError ??
                      "Optional override, and it must stay on this site. Leave blank to use your Cueful page URL."
                    }
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
                          Default Cueful share image
                        </Typography>
                      </div>
                    )}
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
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
                        {draft.seo_image_path ? "Replace image" : "Choose share image"}
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
                  <FormControlLabel
                    control={
                      <Switch
                        checked={draft.seo_noindex}
                        onChange={(event) =>
                          update("seo_noindex", event.target.checked)
                        }
                      />
                    }
                    label="Hide page from search engines (noindex)"
                  />
                </div>
              </Paper>

              <Paper
                id="settings-qr"
                className="workspace-settings-card"
                variant="outlined"
              >
                <div className="workspace-settings-card__heading">
                  <QrCode2Rounded />
                  <Box>
                    <Typography variant="h3">QR & page sharing</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Share {publicProfileAddress(draft.username)} online or offline.
                    </Typography>
                  </Box>
                </div>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={<IosShareRounded />}
                    onClick={() => setShareOpen(true)}
                    disabled={!draft.is_published}
                  >
                    Open share kit
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyRounded />}
                    onClick={copyPublicPage}
                  >
                    Copy page link
                  </Button>
                </Stack>
              </Paper>

              <Paper
                id="settings-connect"
                className="workspace-settings-card"
                variant="outlined"
              >
                <div className="workspace-settings-card__heading">
                  <HubOutlined />
                  <Box>
                    <Typography variant="h3">Connect</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Social profiles shown as icons on your public page.
                    </Typography>
                  </Box>
                </div>
                <SettingsConnectEditor
                  profileId={profile.id}
                  initialSocials={connectedSocials}
                  onSaved={(next) => {
                    setConnectedSocials(next);
                    setNotice({
                      severity: "success",
                      message: "Social profiles updated.",
                    });
                    router.refresh();
                  }}
                />
              </Paper>

              <Paper className="workspace-settings-card" variant="outlined">
                <div className="workspace-settings-card__heading">
                  <SettingsOutlined />
                  <Box>
                    <Typography variant="h3">Visibility</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Decide where your page appears and whether it credits Cueful.
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-settings-switch">
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontWeight={850}>Public page</Typography>
                      <Chip
                        size="small"
                        color={draft.is_published ? "success" : "default"}
                        variant="outlined"
                        icon={
                          draft.is_published ? <CheckCircleRounded /> : undefined
                        }
                        label={draft.is_published ? "Published" : "Draft"}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Turn this off to keep the page private while editing.
                    </Typography>
                  </Box>
                  <Switch
                    checked={draft.is_published}
                    onChange={(event) =>
                      update("is_published", event.target.checked)
                    }
                    inputProps={{ "aria-label": "Publish public page" }}
                  />
                </div>
                <div className="workspace-settings-switch">
                  <Box>
                    <Typography fontWeight={850}>Cueful Discover</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Let people find this published profile in Discover.
                    </Typography>
                  </Box>
                  <Switch
                    checked={draft.is_discoverable}
                    onChange={(event) =>
                      update("is_discoverable", event.target.checked)
                    }
                    inputProps={{ "aria-label": "List profile in Cueful Discover" }}
                  />
                </div>
                <div className="workspace-settings-switch">
                  <Box>
                    <Typography fontWeight={850}>Create your Cueful badge</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Show a small, removable supporter badge on the public page.
                    </Typography>
                  </Box>
                  <Switch
                    checked={draft.show_cueful_badge}
                    onChange={(event) =>
                      update("show_cueful_badge", event.target.checked)
                    }
                    inputProps={{ "aria-label": "Show Create your Cueful badge" }}
                  />
                </div>
              </Paper>

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

                <Typography variant="caption" color="text.secondary">
                  The invite and supporter badge are optional. Nothing is forced
                  onto your public page.
                </Typography>
              </Paper>

              <Paper
                id="settings-tools"
                className="workspace-settings-card"
                variant="outlined"
              >
                <div className="workspace-settings-card__heading">
                  <ShieldOutlined />
                  <Box>
                    <Typography variant="h3">Privacy & data rights</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Download a copy of your Cueful data or review the privacy
                      policy and terms.
                    </Typography>
                  </Box>
                </div>
                <Stack spacing={1.5}>
                  <Button
                    variant="outlined"
                    startIcon={
                      exportingData ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DownloadRounded />
                      )
                    }
                    onClick={downloadAccountData}
                    disabled={exportingData}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {exportingData ? "Preparing…" : "Download my data"}
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    Get a JSON file with your profile, links, offers, shop items,
                    media, FAQs, and highlights.
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Button component={Link} href="/privacy" variant="text">
                      Privacy policy
                    </Button>
                    <Button component={Link} href="/terms" variant="text">
                      Terms of service
                    </Button>
                    <Button
                      color="inherit"
                      variant="outlined"
                      startIcon={<LogoutRounded />}
                      onClick={signOut}
                    >
                      Sign out
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              <Paper className="workspace-settings-card workspace-settings-card--danger" variant="outlined">
                <div className="workspace-settings-card__heading">
                  <DeleteOutlineRounded />
                  <Box>
                    <Typography variant="h3">Danger zone</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Permanent account deletion.
                    </Typography>
                  </Box>
                </div>
                <div className="workspace-settings-danger">
                  <Box>
                    <Typography fontWeight={850}>Delete account</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Permanently remove your page and all associated data.
                    </Typography>
                  </Box>
                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteOutlineRounded />}
                    onClick={() => {
                      setDeleteConfirmation("");
                      setDeleteOpen(true);
                    }}
                  >
                    Delete account
                  </Button>
                </div>
              </Paper>

              <Button
                variant="contained"
                onClick={saveProfile}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={17} /> : undefined}
                sx={{ alignSelf: "flex-start" }}
              >
                {saving ? "Saving settings…" : "Save settings"}
              </Button>
            </Stack>
          )}
        </div>
      </section>

      <aside
        className={`workspace-preview workspace-preview--${draft.template} ${profileThemeClassName(
          activeTheme,
          { wallpaperUrl },
        )}`}
        style={
          profileThemeStyle(activeTheme, {
            wallpaperUrl,
          }) as React.CSSProperties
        }
        aria-label="Live page preview"
      >
        <header className="workspace-preview__topbar">
          <Chip
            label={publicProfileAddress(draft.username || "username")}
            variant="outlined"
          />
          <Typography variant="caption">LIVE PREVIEW</Typography>
        </header>
        <div
          className={`workspace-phone workspace-phone--${draft.template} ${profileThemeClassName(
            activeTheme,
            { wallpaperUrl },
          )}`}
          style={
            profileThemeStyle(activeTheme, {
              wallpaperUrl,
            }) as React.CSSProperties
          }
        >
          <div className="workspace-phone__body">
            {brandingLogoUrl && (
              <Box
                component="img"
                className="workspace-phone__brand-logo"
                src={brandingLogoUrl}
                alt=""
              />
            )}
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

            {connectedSocials.length > 0 && (
              <div className="workspace-phone__socials" aria-label="Social profile preview">
                {connectedSocials.slice(0, 5).map((social) => (
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

      <nav className="workspace-mobile-nav" aria-label="Mobile dashboard sections">
        <ButtonBase
          className={section === "content" ? "is-active" : ""}
          onClick={() => {
            setSection("content");
            setMobileMode("edit");
          }}
          aria-current={section === "content" ? "page" : undefined}
        >
          <InsertLinkRounded />
          <span>Links</span>
        </ButtonBase>
        <ButtonBase
          className={
            section === "profile" || section === "appearance" ? "is-active" : ""
          }
          onClick={() => {
            setSection(
              section === "profile" || section === "appearance"
                ? section
                : "profile",
            );
            setMobileMode("edit");
          }}
          aria-current={
            section === "profile" || section === "appearance"
              ? "page"
              : undefined
          }
        >
          <ColorLensOutlined />
          <span>Design</span>
        </ButtonBase>
        <ButtonBase
          className={section === "connections" ? "is-active" : ""}
          onClick={() => {
            setSection("connections");
            setMobileMode("edit");
          }}
          aria-current={section === "connections" ? "page" : undefined}
        >
          <GroupsOutlined />
          <span>People</span>
        </ButtonBase>
        <ButtonBase
          className={section === "analytics" ? "is-active" : ""}
          onClick={() => {
            setSection("analytics");
            setMobileMode("edit");
          }}
          aria-current={section === "analytics" ? "page" : undefined}
        >
          <AnalyticsOutlined />
          <span>Analytics</span>
        </ButtonBase>
        <ButtonBase
          className={
            ["more", "highlights", "health", "account", "commerce"].includes(section)
              ? "is-active"
              : ""
          }
          onClick={() => {
            setSection("more");
            setMobileMode("edit");
          }}
          aria-current={
            ["more", "highlights", "health", "account", "commerce"].includes(section)
              ? "page"
              : undefined
          }
        >
          <MoreHorizRounded />
          <span>More</span>
        </ButtonBase>
      </nav>

      {tourOpen && (
        <div className="dashboard-tour" role="dialog" aria-modal="true" aria-label="Dashboard tour">
          <Paper className="dashboard-tour__card" elevation={8}>
            <div className="dashboard-tour__top">
              <Chip
                label={`${tourStep + 1} OF ${dashboardTour.length}`}
                size="small"
                variant="outlined"
              />
              <IconButton aria-label="Close dashboard tour" onClick={finishTour}>
                <CloseRounded />
              </IconButton>
            </div>
            <Typography className="section-label">
              {dashboardTour[tourStep].eyebrow}
            </Typography>
            <Typography variant="h2">{dashboardTour[tourStep].title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {dashboardTour[tourStep].body}
            </Typography>
            <div
              className="dashboard-tour__progress"
              aria-hidden="true"
              style={{
                gridTemplateColumns: `repeat(${dashboardTour.length}, minmax(0, 1fr))`,
              }}
            >
              {dashboardTour.map((item, index) => (
                <i
                  className={index <= tourStep ? "is-active" : ""}
                  key={item.eyebrow}
                />
              ))}
            </div>
            <div className="dashboard-tour__actions">
              <Button color="inherit" onClick={finishTour}>
                Skip
              </Button>
              <div>
                {tourStep > 0 && (
                  <Button color="inherit" onClick={() => showTourStep(tourStep - 1)}>
                    Back
                  </Button>
                )}
                <Button
                  variant="contained"
                  endIcon={
                    tourStep === dashboardTour.length - 1
                      ? <CheckCircleRounded />
                      : <ArrowOutwardRounded />
                  }
                  onClick={() =>
                    tourStep === dashboardTour.length - 1
                      ? finishTour()
                      : showTourStep(tourStep + 1)
                  }
                >
                  {tourStep === dashboardTour.length - 1 ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          </Paper>
        </div>
      )}

      {sharePromptOpen && !tourOpen && draft.is_published && (
        <Paper className="dashboard-share-prompt" elevation={10}>
          <div className="dashboard-share-prompt__top">
            <Chip label="YOUR PAGE IS LIVE" size="small" color="success" />
            <IconButton aria-label="Dismiss share reminder" onClick={dismissSharePrompt}>
              <CloseRounded />
            </IconButton>
          </div>
          <Typography variant="h3">Put Cueful in your bio</Typography>
          <Typography variant="body2" color="text.secondary">
            {publicProfileAddress(draft.username)} is ready to share.
          </Typography>
          <div className="dashboard-share-prompt__actions">
            <Button
              variant="contained"
              startIcon={<ContentCopyRounded />}
              onClick={copyPublicPage}
            >
              Copy page link
            </Button>
            <Button
              variant="outlined"
              startIcon={<IosShareRounded />}
              onClick={() => setShareOpen(true)}
            >
              Share Kit
            </Button>
          </div>
        </Paper>
      )}

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
      <Dialog
        open={deleteOpen}
        onClose={() => (!deletingAccount ? setDeleteOpen(false) : undefined)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete account permanently?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This removes your Cueful page, links, offers, shop items, analytics,
            and uploaded files. Type DELETE to confirm.
          </Typography>
          <TextField
            label="Confirmation"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder="DELETE"
            fullWidth
            disabled={deletingAccount}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteOpen(false)}
            disabled={deletingAccount}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deletingAccount || deleteConfirmation !== "DELETE"}
            onClick={deleteAccount}
            startIcon={
              deletingAccount ? <CircularProgress size={16} /> : undefined
            }
          >
            {deletingAccount ? "Deleting…" : "Delete forever"}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
