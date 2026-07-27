"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
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
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LinkDraft = {
  id: number;
  title: string;
  url: string;
  is_active: boolean;
  is_featured: boolean;
};

type ReferralDraft = {
  id: number;
  provider: string;
  offer: string;
  url: string;
  code: string;
  is_active: boolean;
};

export type OnboardingInitialData = {
  profile: {
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
  const [instagram, setInstagram] = useState(
    initialData.socials.find((item) => item.platform === "Instagram")?.url ?? "",
  );
  const [xProfile, setXProfile] = useState(
    initialData.socials.find((item) => item.platform === "X / Twitter")?.url ?? "",
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
        }],
  );
  const [referrals, setReferrals] = useState<ReferralDraft[]>(
    initialData.referrals.map((item) => ({ ...item, code: item.code ?? "" })),
  );
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "info" | "warning" | "error";
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
      },
    ]);
    setNotice({ message: "Link added", severity: "success" });
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

  async function next() {
    if (activeStep === 1) {
      setActiveStep(2);
      return;
    }

    const completedLinks = links.filter((item) => item.title.trim() && item.url.trim());
    const completedReferrals = referrals.filter(
      (item) => item.provider.trim() && item.offer.trim() && item.url.trim(),
    );

    if (completedLinks.length === 0) {
      setNotice({
        message: "Add at least one link with a title and URL.",
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

    setSaving(true);
    const supabase = createClient();
    const socials = [
      instagram.trim()
        ? { platform: "Instagram", url: instagram.trim() }
        : null,
      xProfile.trim()
        ? { platform: "X / Twitter", url: xProfile.trim() }
        : null,
    ].filter((item): item is { platform: string; url: string } => Boolean(item));
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
      links_data: completedLinks,
      referrals_data: completedReferrals.map((item, index) => ({
        ...item,
        color: referralColors[index % referralColors.length],
      })),
      socials_data: socials,
    });
    setSaving(false);

    if (error) {
      setNotice({ message: error.message, severity: "error" });
      return;
    }

    router.push(`/u/${encodeURIComponent(username)}?published=1`);
    router.refresh();
  }

  return (
    <main className="setup-shell">
      <header className="setup-topbar">
        <Link className="brand" href="/" aria-label="Linkbranch home">
          link<span>branch</span><i>.</i>
        </Link>
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
                        startAdornment: <InputAdornment position="start">linkbranch.com/</InputAdornment>,
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
                <Typography component="h2" variant="h3">Social profiles</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                  Optional. Add the full profile URL.
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Instagram"
                    placeholder="https://instagram.com/username"
                    value={instagram}
                    onChange={(event) => setInstagram(event.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="X / Twitter"
                    placeholder="https://x.com/username"
                    value={xProfile}
                    onChange={(event) => setXProfile(event.target.value)}
                    fullWidth
                  />
                </Stack>
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
                <Stack spacing={2} sx={{ mt: 2.5 }}>
                  {links.map((item, index) => (
                    <Box className="link-editor" key={item.id}>
                      <span className="link-editor__handle">{index + 1}</span>
                      <TextField
                        label="Link title"
                        value={item.title}
                        onChange={(event) => updateLink(item.id, "title", event.target.value)}
                        fullWidth
                        size="small"
                      />
                      <TextField
                        label="URL"
                        value={item.url}
                        onChange={(event) => updateLink(item.id, "url", event.target.value)}
                        fullWidth
                        size="small"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start"><LinkRounded fontSize="small" /></InputAdornment>
                            ),
                          },
                        }}
                      />
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
                          onClick={() => featureLink(item.id)}
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
                            onChange={() => toggleLinkVisibility(item.id)}
                          />
                        }
                        label={item.is_active ? "Visible" : "Hidden"}
                      />
                      <Tooltip title="Remove link" arrow>
                        <IconButton aria-label={`Remove ${item.title || "link"}`} onClick={() => removeLink(item.id)}>
                          <DeleteOutlineRounded />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Stack>
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
                          placeholder="https://example.com/ref/your-name"
                          value={item.url}
                          onChange={(event) =>
                            updateReferral(item.id, "url", event.target.value)
                          }
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
