"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import LinkRounded from "@mui/icons-material/LinkRounded";
import StarOutlineRounded from "@mui/icons-material/StarOutlineRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { PUBLIC_PROFILE_PREFIX } from "@/lib/brand";
import { useRouter } from "next/navigation";
import {
  getSocialPlatformIcon,
  getSocialPlatformOption,
  socialPlatformOptions,
} from "@/lib/social-platforms";
import { createClient } from "@/lib/supabase/client";
import {
  imageExtension,
  publicAssetUrl,
  PUBLIC_ASSET_BUCKET,
  validateImage,
} from "@/lib/storage";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type LinkDraft = {
  id: number;
  title: string;
  url: string;
  is_active: boolean;
  is_featured: boolean;
  thumbnail_path: string | null;
};

type ReferralDraft = {
  id: number;
  provider: string;
  offer: string;
  url: string;
  code: string;
  is_active: boolean;
};

type SocialDraft = {
  id: number;
  platform: string;
  url: string;
};

export type OnboardingInitialData = {
  profile: {
    id: string;
    display_name: string;
    username: string;
    greeting: string;
    headline: string;
    headline_accent: string;
    bio: string;
    location: string;
    show_location: boolean;
  };
  links: Array<{
    id: number;
    title: string;
    url: string;
    is_active: boolean;
    is_featured: boolean;
    thumbnail_path: string | null;
  }>;
  referrals: Array<{
    id: number;
    provider: string;
    offer: string;
    url: string;
    code: string | null;
    is_active: boolean;
  }>;
  socials: Array<{ platform: string; url: string }>;
};

const templateNames: Record<string, string> = {
  "field-notes": "Field Notes",
  "after-dark": "After Dark",
  "soft-studio": "Soft Studio",
};

function normalizeHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      !parsed.hostname
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function SortableLinkEditor({
  item,
  uploading,
  onUpdate,
  onFeature,
  onVisibility,
  onRemove,
  onUpload,
  onRemoveThumbnail,
}: {
  item: LinkDraft;
  uploading: boolean;
  onUpdate: (id: number, field: "title" | "url", value: string) => void;
  onFeature: (id: number) => void;
  onVisibility: (id: number) => void;
  onRemove: (id: number) => void;
  onUpload: (id: number, event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveThumbnail: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <Box
      ref={setNodeRef}
      className={`link-editor${isDragging ? " is-dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Tooltip title="Drag to reorder" arrow>
        <IconButton
          className="link-editor__handle"
          aria-label={`Reorder ${item.title || "link"}`}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorRounded />
        </IconButton>
      </Tooltip>

      <div className="link-editor__fields">
        <TextField
          label="Link title"
          value={item.title}
          onChange={(event) => onUpdate(item.id, "title", event.target.value)}
          fullWidth
          size="small"
        />
        <TextField
          label="URL"
          type="url"
          placeholder="https://example.com"
          value={item.url}
          onChange={(event) => onUpdate(item.id, "url", event.target.value)}
          onBlur={() => {
            const normalized = normalizeHttpUrl(item.url);
            if (normalized) {
              onUpdate(item.id, "url", normalized);
            }
          }}
          fullWidth
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LinkRounded fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      <div className="link-editor__thumbnail">
        {item.thumbnail_path ? (
          <>
            <Box
              component="img"
              src={publicAssetUrl(item.thumbnail_path)}
              alt=""
            />
            <Tooltip title="Remove thumbnail" arrow>
              <IconButton
                size="small"
                aria-label={`Remove ${item.title || "link"} thumbnail`}
                onClick={() => onRemoveThumbnail(item.id)}
              >
                <CloseRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Button
            component="label"
            size="small"
            variant="outlined"
            startIcon={
              uploading ? <CircularProgress size={14} /> : <ImageOutlined />
            }
            disabled={uploading}
          >
            Thumbnail
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => onUpload(item.id, event)}
            />
          </Button>
        )}
      </div>

      <div className="link-editor__actions">
        <Tooltip
          title={item.is_featured ? "Remove spotlight" : "Spotlight this link"}
          arrow
        >
          <IconButton
            color={item.is_featured ? "primary" : "default"}
            aria-label={
              item.is_featured
                ? `Remove ${item.title || "link"} from spotlight`
                : `Spotlight ${item.title || "link"}`
            }
            onClick={() => onFeature(item.id)}
          >
            {item.is_featured ? <StarRounded /> : <StarOutlineRounded />}
          </IconButton>
        </Tooltip>
        <FormControlLabel
          className="link-editor__visibility"
          control={
            <Switch
              size="small"
              checked={item.is_active}
              onChange={() => onVisibility(item.id)}
            />
          }
          label={item.is_active ? "Visible" : "Hidden"}
        />
        <Tooltip title="Remove link" arrow>
          <IconButton
            aria-label={`Remove ${item.title || "link"}`}
            onClick={() => onRemove(item.id)}
          >
            <DeleteOutlineRounded />
          </IconButton>
        </Tooltip>
      </div>
    </Box>
  );
}

export function OnboardingWizard({
  initialTemplate,
  initialData,
}: {
  initialTemplate: string;
  initialData: OnboardingInitialData;
}) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [displayName, setDisplayName] = useState(initialData.profile.display_name);
  const [greeting, setGreeting] = useState(initialData.profile.greeting);
  const [headline, setHeadline] = useState(initialData.profile.headline);
  const [headlineAccent, setHeadlineAccent] = useState(
    initialData.profile.headline_accent,
  );
  const [username, setUsername] = useState(initialData.profile.username);
  const [bio, setBio] = useState(initialData.profile.bio);
  const [location, setLocation] = useState(initialData.profile.location);
  const [showLocation, setShowLocation] = useState(
    initialData.profile.show_location,
  );
  const [socials, setSocials] = useState<SocialDraft[]>(
    initialData.socials.map((item, index) => ({
      id: index + 1,
      platform: item.platform,
      url: item.url,
    })),
  );
  const [links, setLinks] = useState<LinkDraft[]>(
    initialData.links.length
      ? initialData.links
      : [{
          id: 1,
        title: "",
        url: "",
        is_active: true,
        is_featured: false,
        thumbnail_path: null,
      }],
  );
  const [referrals, setReferrals] = useState<ReferralDraft[]>(
    initialData.referrals.map((item) => ({ ...item, code: item.code ?? "" })),
  );
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnailId, setUploadingThumbnailId] = useState<number | null>(
    null,
  );
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "info" | "warning" | "error";
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pendingThumbnailDeletesRef = useRef(new Set<string>());
  const dragSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const templateName = templateNames[initialTemplate] ?? templateNames["field-notes"];
  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "PB",
    [displayName],
  );
  const unusedSocialPlatforms = useMemo(
    () =>
      socialPlatformOptions.filter(
        (option) => !socials.some((item) => item.platform === option.label),
      ),
    [socials],
  );

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [activeStep]);

  function updateLink(id: number, field: "title" | "url", value: string) {
    setLinks((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function addLink() {
    setLinks((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        title: "",
        url: "",
        is_active: true,
        is_featured: false,
        thumbnail_path: null,
      },
    ]);
    setNotice({ message: "Link added", severity: "success" });
  }

  function reorderLinks(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLinks((current) => {
      const previousIndex = current.findIndex((item) => item.id === active.id);
      const nextIndex = current.findIndex((item) => item.id === over.id);
      return arrayMove(current, previousIndex, nextIndex);
    });
    setNotice({ message: "Link order updated", severity: "success" });
  }

  async function uploadLinkThumbnail(
    id: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateImage(file);
    if (validationError) {
      setNotice({ message: validationError, severity: "error" });
      return;
    }

    setUploadingThumbnailId(id);
    const supabase = createClient();
    const path = `${initialData.profile.id}/links/link-${id}-${crypto.randomUUID()}.${imageExtension(file)}`;
    const { error } = await supabase.storage
      .from(PUBLIC_ASSET_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      setUploadingThumbnailId(null);
      setNotice({ message: error.message, severity: "error" });
      return;
    }

    const previousPath = links.find((item) => item.id === id)?.thumbnail_path;
    setLinks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, thumbnail_path: path } : item,
      ),
    );
    if (previousPath) {
      pendingThumbnailDeletesRef.current.add(previousPath);
    }

    setUploadingThumbnailId(null);
    setNotice({ message: "Thumbnail added", severity: "success" });
  }

  async function removeLinkThumbnail(id: number) {
    const path = links.find((item) => item.id === id)?.thumbnail_path;
    setLinks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, thumbnail_path: null } : item,
      ),
    );

    if (path) {
      pendingThumbnailDeletesRef.current.add(path);
    }
    setNotice({ message: "Thumbnail removed", severity: "warning" });
  }

  function toggleLinkVisibility(id: number) {
    setLinks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_active: !item.is_active } : item,
      ),
    );
  }

  function featureLink(id: number) {
    setLinks((current) =>
      current.map((item) => ({
        ...item,
        is_featured: item.id === id ? !item.is_featured : false,
      })),
    );
  }

  function removeLink(id: number) {
    const removed = links.find((item) => item.id === id);
    setLinks((current) => current.filter((item) => item.id !== id));

    if (removed?.thumbnail_path) {
      pendingThumbnailDeletesRef.current.add(removed.thumbnail_path);
    }

    setNotice({
      message: `${removed?.title || "Link"} removed`,
      severity: "warning",
    });
  }

  function updateReferral(
    id: number,
    field: "provider" | "offer" | "url" | "code",
    value: string,
  ) {
    setReferrals((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function addReferral() {
    setReferrals((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        provider: "",
        offer: "",
        url: "",
        code: "",
        is_active: true,
      },
    ]);
    setNotice({ message: "Referral added", severity: "success" });
  }

  function toggleReferralVisibility(id: number) {
    setReferrals((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_active: !item.is_active } : item,
      ),
    );
  }

  function removeReferral(id: number) {
    const removed = referrals.find((item) => item.id === id);
    setReferrals((current) => current.filter((item) => item.id !== id));
    setNotice({
      message: `${removed?.provider || "Referral"} removed`,
      severity: "warning",
    });
  }

  function addSocial(platform?: string) {
    const nextPlatform = platform ?? unusedSocialPlatforms[0]?.label;
    if (!nextPlatform) {
      setNotice({
        message: "All supported social profiles are already added.",
        severity: "info",
      });
      return;
    }

    setSocials((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        platform: nextPlatform,
        url: "",
      },
    ]);
    setNotice({ message: `${nextPlatform} added`, severity: "success" });
  }

  function updateSocial(
    id: number,
    field: "platform" | "url",
    value: string,
  ) {
    setSocials((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function removeSocial(id: number) {
    const removed = socials.find((item) => item.id === id);
    setSocials((current) => current.filter((item) => item.id !== id));
    setNotice({
      message: `${removed?.platform || "Social profile"} removed`,
      severity: "warning",
    });
  }

  async function next() {
    if (activeStep === 1) {
      setActiveStep(2);
      return;
    }

    const completedLinks = links.filter((item) => item.title.trim() && item.url.trim());
    const completedReferrals = referrals.filter(
      (item) => item.provider.trim() && item.offer.trim() && item.url.trim(),
    );
    const completedSocials = socials.filter(
      (item) => item.platform.trim() && item.url.trim(),
    );

    if (completedLinks.length === 0) {
      setNotice({
        message: "Add at least one link with a title and URL.",
        severity: "error",
      });
      return;
    }

    if (
      links.some(
        (item) =>
          (item.title || item.url) &&
          (!item.title.trim() || !item.url.trim()),
      )
    ) {
      setNotice({
        message: "Complete both the title and URL for every link.",
        severity: "error",
      });
      return;
    }

    if (
      referrals.some(
        (item) =>
          (item.provider || item.offer || item.url || item.code) &&
          (!item.provider.trim() || !item.offer.trim() || !item.url.trim()),
      )
    ) {
      setNotice({
        message: "Complete the provider, offer, and URL for each referral.",
        severity: "error",
      });
      return;
    }

    if (
      socials.some(
        (item) =>
          (item.platform || item.url) &&
          (!item.platform.trim() || !item.url.trim()),
      )
    ) {
      setNotice({
        message: "Add the full URL for every selected social profile.",
        severity: "error",
      });
      return;
    }

    const normalizedLinks = completedLinks.map((item) => ({
      ...item,
      url: normalizeHttpUrl(item.url),
    }));
    if (normalizedLinks.some((item) => !item.url)) {
      setNotice({
        message: "Enter a valid link URL, such as https://example.com.",
        severity: "error",
      });
      return;
    }

    const normalizedReferrals = completedReferrals.map((item) => ({
      ...item,
      url: normalizeHttpUrl(item.url),
    }));
    if (normalizedReferrals.some((item) => !item.url)) {
      setNotice({
        message: "Enter a valid URL for every referral offer.",
        severity: "error",
      });
      return;
    }

    const normalizedSocials = completedSocials.map((item) => ({
      ...item,
      url: normalizeHttpUrl(item.url),
    }));
    if (normalizedSocials.some((item) => !item.url)) {
      setNotice({
        message: "Enter a valid URL for every social profile.",
        severity: "error",
      });
      return;
    }

    const socialPlatforms = completedSocials.map((item) => item.platform);
    if (new Set(socialPlatforms).size !== socialPlatforms.length) {
      setNotice({
        message: "Each social platform can only be added once.",
        severity: "error",
      });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const referralColors = ["#e8347d", "#20221f", "#3659d9", "#a33b20"];

    const { error } = await supabase.rpc("save_profile_bundle", {
      profile_data: {
        username,
        display_name: displayName,
        greeting,
        headline,
        headline_accent: headlineAccent,
        bio,
        location,
        show_location: showLocation,
        template: initialTemplate,
        is_published: true,
      },
      links_data: normalizedLinks,
      referrals_data: normalizedReferrals.map((item, index) => ({
        ...item,
        color: referralColors[index % referralColors.length],
      })),
      socials_data: normalizedSocials.map((item) => ({
        platform: item.platform.trim(),
        url: item.url,
      })),
    });
    setSaving(false);

    if (error) {
      setNotice({ message: error.message, severity: "error" });
      return;
    }

    const staleThumbnailPaths = Array.from(
      pendingThumbnailDeletesRef.current,
    );
    if (staleThumbnailPaths.length > 0) {
      const { error: cleanupError } = await supabase.storage
        .from(PUBLIC_ASSET_BUCKET)
        .remove(staleThumbnailPaths);
      if (!cleanupError) {
        pendingThumbnailDeletesRef.current.clear();
      }
    }

    router.push(`/u/${encodeURIComponent(username)}?published=1`);
    router.refresh();
  }

  return (
    <main className="setup-shell">
      <header className="setup-topbar">
        <BrandMark />
        <Button color="inherit" size="small">Save and exit</Button>
      </header>

      <div className="setup-layout">
        <aside className="setup-sidebar">
          <Typography variant="overline" color="text.secondary">PROFILE SETUP</Typography>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step completed>
              <StepLabel optional={<Typography variant="caption">{templateName}</Typography>}>
                Choose template
              </StepLabel>
            </Step>
            <Step>
              <StepLabel optional={<Typography variant="caption">Name, bio, and socials</Typography>}>
                Profile details
              </StepLabel>
            </Step>
            <Step>
              <StepLabel optional={<Typography variant="caption">Links and referral offers</Typography>}>
                Add content
              </StepLabel>
            </Step>
          </Stepper>
          <Box className="setup-help">
            <Typography variant="body2" fontWeight={700}>Need to change the design?</Typography>
            <Button component={Link} href="/templates" size="small" sx={{ px: 0 }}>
              Back to templates
            </Button>
          </Box>
        </aside>

        <section className="setup-content" ref={contentRef}>
          <div className="setup-content__header">
            <Box>
              <Typography variant="caption" color="text.secondary">
                STEP {activeStep + 1} OF 3
              </Typography>
              <Typography component="h1" variant="h2" sx={{ mt: 0.75 }}>
                {activeStep === 1 ? "Profile details" : "Add your links"}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {activeStep === 1
                  ? "This information appears at the top of your public page."
                  : "Add the places you want visitors to go. You can reorder these later."}
              </Typography>
            </Box>
            <Chip label={templateName} size="small" variant="outlined" />
          </div>

          {activeStep === 1 ? (
            <Stack spacing={3} className="setup-form">
              <Paper variant="outlined" className="form-section">
                <Typography component="h2" variant="h3">Profile image</Typography>
                <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mt: 2 }}>
                  <Avatar className="setup-avatar">{initials}</Avatar>
                  <Box>
                    <Button variant="outlined" startIcon={<ImageOutlined />} component="label">
                      Upload image
                      <input hidden type="file" accept="image/png,image/jpeg,image/webp" />
                    </Button>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      JPG, PNG, or WebP. Maximum 5 MB.
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper variant="outlined" className="form-section">
                <Typography component="h2" variant="h3">Basic information</Typography>
                <div className="form-grid">
                  <TextField
                    label="Display name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value.replace(/\s/g, "").toLowerCase())}
                    fullWidth
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">{PUBLIC_PROFILE_PREFIX}</InputAdornment>
                        ),
                      },
                    }}
                    helperText="Letters, numbers, hyphens, and underscores."
                  />
                  <TextField
                    label="Greeting"
                    value={greeting}
                    onChange={(event) => setGreeting(event.target.value)}
                    fullWidth
                    inputProps={{ maxLength: 32 }}
                    helperText="Appears before your display name."
                  />
                  <TextField
                    label="Headline"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    fullWidth
                    inputProps={{ maxLength: 48 }}
                  />
                  <TextField
                    label="Accent text"
                    value={headlineAccent}
                    onChange={(event) => setHeadlineAccent(event.target.value)}
                    fullWidth
                    inputProps={{ maxLength: 24 }}
                    helperText="Shown in the template’s accent style."
                  />
                  <TextField
                    label="Supporting paragraph"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    className="form-grid__wide"
                    inputProps={{ maxLength: 160 }}
                    helperText={`${bio.length}/160`}
                  />
                  <TextField
                    label="Location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    fullWidth
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showLocation}
                        onChange={(event) => setShowLocation(event.target.checked)}
                      />
                    }
                    label="Show location on profile"
                  />
                </div>
              </Paper>

              <Paper variant="outlined" className="form-section">
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography component="h2" variant="h3">
                      Social profiles
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.75 }}
                    >
                      Optional. Add the full URL for every profile you want to show.
                    </Typography>
                  </Box>
                  <Button
                    startIcon={<AddRounded />}
                    onClick={() => addSocial()}
                    disabled={unusedSocialPlatforms.length === 0}
                  >
                    Add social
                  </Button>
                </Stack>

                <Stack spacing={1.5} sx={{ mt: 2.5 }}>
                  {socials.map((item) => {
                    const option = getSocialPlatformOption(item.platform);
                    return (
                      <Box className="social-profile-editor" key={item.id}>
                        <TextField
                          select
                          label="Platform"
                          value={item.platform}
                          onChange={(event) =>
                            updateSocial(item.id, "platform", event.target.value)
                          }
                          slotProps={{ inputLabel: { shrink: true } }}
                        >
                          {!option && (
                            <MenuItem value={item.platform}>
                              {item.platform}
                            </MenuItem>
                          )}
                          {socialPlatformOptions.map((platform) => (
                            <MenuItem
                              value={platform.label}
                              disabled={socials.some(
                                (social) =>
                                  social.id !== item.id &&
                                  social.platform === platform.label,
                              )}
                              key={platform.label}
                            >
                              <span className="social-platform-option">
                                {platform.icon}
                                {platform.label}
                              </span>
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label={`${item.platform} profile URL`}
                          type="url"
                          placeholder={
                            option?.placeholder ?? "https://example.com/profile"
                          }
                          value={item.url}
                          onChange={(event) =>
                            updateSocial(item.id, "url", event.target.value)
                          }
                          onBlur={() => {
                            const normalized = normalizeHttpUrl(item.url);
                            if (normalized) {
                              updateSocial(item.id, "url", normalized);
                            }
                          }}
                          fullWidth
                          slotProps={{
                            inputLabel: { shrink: true },
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  {getSocialPlatformIcon(item.platform)}
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                        <Tooltip title={`Remove ${item.platform}`} arrow>
                          <IconButton
                            aria-label={`Remove ${item.platform}`}
                            onClick={() => removeSocial(item.id)}
                          >
                            <DeleteOutlineRounded />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  })}

                  {socials.length === 0 && (
                    <Box className="social-profile-empty">
                      <Typography fontWeight={800}>
                        No social profiles added
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Choose the networks that are actually useful to your audience.
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {unusedSocialPlatforms.length > 0 && (
                  <div className="social-platform-picker">
                    <Typography variant="caption" color="text.secondary">
                      QUICK ADD
                    </Typography>
                    <div>
                      {unusedSocialPlatforms.map((platform) => (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={platform.icon}
                          onClick={() => addSocial(platform.label)}
                          key={platform.label}
                        >
                          {platform.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </Paper>
            </Stack>
          ) : (
            <Stack spacing={3} className="setup-form">
              <Paper variant="outlined" className="form-section">
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography component="h2" variant="h3">Links</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Add at least one destination. Keep drafts hidden or spotlight one link.
                    </Typography>
                  </Box>
                  <Button startIcon={<AddRounded />} onClick={addLink}>Add link</Button>
                </Stack>
                <DndContext
                  sensors={dragSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={reorderLinks}
                >
                  <SortableContext
                    items={links.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Stack spacing={2} sx={{ mt: 2.5 }}>
                      {links.map((item) => (
                        <SortableLinkEditor
                          key={item.id}
                          item={item}
                          uploading={uploadingThumbnailId === item.id}
                          onUpdate={updateLink}
                          onFeature={featureLink}
                          onVisibility={toggleLinkVisibility}
                          onRemove={removeLink}
                          onUpload={uploadLinkThumbnail}
                          onRemoveThumbnail={removeLinkThumbnail}
                        />
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
              </Paper>

              <Paper variant="outlined" className="form-section">
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography component="h2" variant="h3">Referral offers</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Share a benefit and the URL visitors should use to claim it.
                    </Typography>
                  </Box>
                  <Button variant="outlined" startIcon={<AddRounded />} onClick={addReferral}>
                    Add referral
                  </Button>
                </Stack>

                <Stack spacing={2} sx={{ mt: 2.5 }}>
                  {referrals.map((item, index) => (
                    <Box className="referral-editor" key={item.id}>
                      <div className="referral-editor__header">
                        <Typography variant="caption" fontWeight={800}>
                          REFERRAL {index + 1}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={item.is_active}
                                onChange={() => toggleReferralVisibility(item.id)}
                              />
                            }
                            label={item.is_active ? "Visible" : "Hidden"}
                          />
                          <Tooltip title="Remove referral" arrow>
                            <IconButton
                              aria-label={`Remove ${item.provider || "referral"}`}
                              onClick={() => removeReferral(item.id)}
                              size="small"
                            >
                              <DeleteOutlineRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </div>
                      <div className="referral-editor__grid">
                        <TextField
                          label="Provider"
                          placeholder="Lyft"
                          value={item.provider}
                          onChange={(event) =>
                            updateReferral(item.id, "provider", event.target.value)
                          }
                          fullWidth
                          size="small"
                          required
                        />
                        <TextField
                          label="Offer"
                          placeholder="$15 off your first ride"
                          value={item.offer}
                          onChange={(event) =>
                            updateReferral(item.id, "offer", event.target.value)
                          }
                          fullWidth
                          size="small"
                          required
                        />
                        <TextField
                          label="Referral URL"
                          type="url"
                          placeholder="https://example.com/ref/your-name"
                          value={item.url}
                          onChange={(event) =>
                            updateReferral(item.id, "url", event.target.value)
                          }
                          onBlur={() => {
                            const normalized = normalizeHttpUrl(item.url);
                            if (normalized) {
                              updateReferral(item.id, "url", normalized);
                            }
                          }}
                          fullWidth
                          size="small"
                          required
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LinkRounded fontSize="small" />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                        <TextField
                          label="Coupon code"
                          placeholder="Optional"
                          value={item.code}
                          onChange={(event) =>
                            updateReferral(item.id, "code", event.target.value.toUpperCase())
                          }
                          fullWidth
                          size="small"
                          helperText="Leave blank if the URL applies the offer automatically."
                        />
                      </div>
                    </Box>
                  ))}
                  {referrals.length === 0 && (
                    <Box className="referral-editor__empty">
                      <Typography variant="body2" color="text.secondary">
                        No referral offers yet.
                      </Typography>
                      <Button size="small" startIcon={<AddRounded />} onClick={addReferral}>
                        Add your first referral
                      </Button>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}

          <footer className="setup-footer">
            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
              component={activeStep === 1 ? Link : "button"}
              href={activeStep === 1 ? "/templates" : undefined}
              color="inherit"
            >
              Back
            </Button>
            <Button
              variant="contained"
              endIcon={
                saving ? (
                  <CircularProgress color="inherit" size={18} />
                ) : activeStep === 2 ? (
                  <CheckCircleRounded />
                ) : (
                  <ArrowForwardRounded />
                )
              }
              onClick={next}
              disabled={saving}
            >
              {activeStep === 1
                ? "Continue to links"
                : saving
                  ? "Publishing"
                  : "Save and publish"}
            </Button>
          </footer>
        </section>

        <aside className="setup-preview" aria-label="Profile preview">
          <div className="setup-preview__header">
            <div>
              <Typography variant="h3">Preview</Typography>
              <Typography variant="caption" color="text.secondary">Updates as you type</Typography>
            </div>
            <Tooltip title="Close preview" arrow>
              <IconButton aria-label="Close preview" size="small">
                <CloseRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
          <div className={`setup-phone setup-phone--${initialTemplate}`}>
            <Avatar className="setup-phone__avatar">{initials}</Avatar>
            <Typography fontWeight={800} textAlign="center" sx={{ mt: 1.5 }}>
              {greeting || "Hello, I’m"} {displayName || "Your name"}.
            </Typography>
            <Typography variant="caption" color="inherit" sx={{ opacity: 0.72 }}>
              @{username || "username"}
            </Typography>
            <Typography
              variant="body2"
              textAlign="center"
              fontWeight={800}
              sx={{ mt: 1.5 }}
            >
              {headline || "Your headline"}{" "}
              <span className="setup-phone__accent">
                {headlineAccent || "stands out."}
              </span>
            </Typography>
            <Typography variant="body2" textAlign="center" sx={{ mt: 1.5, opacity: 0.78 }}>
              {bio || "Your bio will appear here."}
            </Typography>
            {showLocation && location && (
              <Typography variant="caption" sx={{ mt: 1, opacity: 0.62 }}>{location}</Typography>
            )}
            {socials.some((item) => item.url.trim()) && (
              <div className="setup-phone__socials" aria-label="Social profile preview">
                {socials
                  .filter((item) => item.url.trim())
                  .slice(0, 6)
                  .map((item) => (
                    <span title={item.platform} key={item.id}>
                      {getSocialPlatformIcon(item.platform)}
                    </span>
                  ))}
              </div>
            )}
            <div className="setup-phone__links">
              {links
                .filter((item) => item.title && item.is_active)
                .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
                .slice(0, 3)
                .map((item) => (
                  <span key={item.id}>
                    {item.is_featured && <b aria-label="Featured">★</b>}
                    {item.title}<b>↗</b>
                  </span>
                ))}
            </div>
            {referrals.some((item) => item.provider || item.offer) && (
              <div className="setup-phone__referrals">
                <span className="setup-phone__section-label">OFFERS</span>
                {referrals
                  .filter((item) => item.is_active && (item.provider || item.offer))
                  .slice(0, 2)
                  .map((item) => (
                    <span className="setup-phone__referral" key={item.id}>
                      <span>
                        <b>{item.provider || "Provider"}</b>
                        <small>{item.offer || "Referral offer"}</small>
                      </span>
                      <strong>{item.code || "VIEW"}</strong>
                    </span>
                  ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={2800}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notice?.severity ?? "info"}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ width: "100%" }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </main>
  );
}
