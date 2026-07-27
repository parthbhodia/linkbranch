"use client";

import { useState } from "react";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import PaletteOutlined from "@mui/icons-material/PaletteOutlined";
import PersonOutlineRounded from "@mui/icons-material/PersonOutlineRounded";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
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

export function Dashboard({
  profile,
  email,
  linkCount,
  referralCount,
  interactionCount,
}: {
  profile: DashboardProfile;
  email: string;
  linkCount: number;
  referralCount: number;
  interactionCount: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

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

    setNotice({ severity: "success", message: "Profile details saved" });
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <Link className="brand" href="/" aria-label="Linkbranch home">
          link<span>branch</span><i>.</i>
        </Link>
        <Stack direction="row" spacing={1}>
          {draft.is_published && (
            <Button
              component={Link}
              href={`/u/${draft.username}`}
              target="_blank"
              endIcon={<ArrowOutwardRounded />}
            >
              View public page
            </Button>
          )}
          <Button color="inherit" startIcon={<LogoutRounded />} onClick={signOut}>
            Sign out
          </Button>
        </Stack>
      </header>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <Avatar className="dashboard-avatar">{initials}</Avatar>
          <Typography variant="h3" sx={{ mt: 2 }}>
            {draft.display_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{draft.username}
          </Typography>
          <Chip
            sx={{ mt: 2 }}
            color={draft.is_published ? "success" : "default"}
            variant="outlined"
            icon={draft.is_published ? <CheckCircleRounded /> : undefined}
            label={draft.is_published ? "Published" : "Draft"}
          />
          <nav className="dashboard-nav" aria-label="Dashboard sections">
            <a href="#profile"><PersonOutlineRounded /> Profile</a>
            <a href="#appearance"><PaletteOutlined /> Appearance</a>
            <a href="#account">Account</a>
          </nav>
        </aside>

        <section className="dashboard-main">
          <div className="dashboard-heading">
            <Box>
              <p className="section-label">CREATOR DASHBOARD</p>
              <Typography component="h1" variant="h2">Your Linkbranch</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Keep your page current and decide when it is public.
              </Typography>
            </Box>
            <Button
              component={Link}
              href={`/onboarding?template=${draft.template}`}
              variant="contained"
            >
              Edit links and referrals
            </Button>
          </div>

          <div className="dashboard-stats">
            <Paper variant="outlined">
              <Typography variant="caption" color="text.secondary">LINKS</Typography>
              <Typography variant="h2">{linkCount}</Typography>
            </Paper>
            <Paper variant="outlined">
              <Typography variant="caption" color="text.secondary">REFERRALS</Typography>
              <Typography variant="h2">{referralCount}</Typography>
            </Paper>
            <Paper variant="outlined">
              <Typography variant="caption" color="text.secondary">INTERACTIONS</Typography>
              <Typography variant="h2">{interactionCount}</Typography>
            </Paper>
          </div>

          <Paper id="profile" className="dashboard-section" variant="outlined">
            <div className="dashboard-section__heading">
              <Box>
                <Typography component="h2" variant="h3">Profile details</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  These fields appear on your public page.
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.is_published}
                    onChange={(event) => update("is_published", event.target.checked)}
                  />
                }
                label="Published"
              />
            </div>
            <div className="dashboard-form-grid">
              <TextField
                label="Display name"
                value={draft.display_name}
                onChange={(event) => update("display_name", event.target.value)}
                required
              />
              <TextField
                label="Username"
                value={draft.username}
                onChange={(event) =>
                  update("username", event.target.value.replace(/\s/g, "").toLowerCase())
                }
                required
                helperText={`Public URL: /u/${draft.username || "username"}`}
              />
              <TextField
                label="Greeting"
                value={draft.greeting}
                onChange={(event) => update("greeting", event.target.value)}
              />
              <TextField
                label="Headline"
                value={draft.headline}
                onChange={(event) => update("headline", event.target.value)}
              />
              <TextField
                label="Accent text"
                value={draft.headline_accent}
                onChange={(event) => update("headline_accent", event.target.value)}
              />
              <TextField
                label="Location"
                value={draft.location}
                onChange={(event) => update("location", event.target.value)}
              />
              <TextField
                className="dashboard-form-grid__wide"
                label="Supporting paragraph"
                value={draft.bio}
                onChange={(event) => update("bio", event.target.value)}
                multiline
                minRows={3}
                inputProps={{ maxLength: 160 }}
                helperText={`${draft.bio.length}/160`}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={draft.show_location}
                    onChange={(event) => update("show_location", event.target.checked)}
                  />
                }
                label="Show location publicly"
              />
            </div>
          </Paper>

          <Paper id="appearance" className="dashboard-section" variant="outlined">
            <Typography component="h2" variant="h3">Appearance</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Switch templates without changing your content.
            </Typography>
            <TextField
              select
              label="Template"
              value={draft.template}
              onChange={(event) => update("template", event.target.value)}
              fullWidth
            >
              <MenuItem value="field-notes">Field Notes</MenuItem>
              <MenuItem value="after-dark">After Dark</MenuItem>
              <MenuItem value="soft-studio">Soft Studio</MenuItem>
            </TextField>
          </Paper>

          <Paper id="account" className="dashboard-section" variant="outlined">
            <Typography component="h2" variant="h3">Account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Your sign-in email is managed by Supabase Auth.
            </Typography>
            <TextField label="Email" value={email} fullWidth disabled />
          </Paper>

          <div className="dashboard-savebar">
            <Typography variant="body2" color="text.secondary">
              Changes become visible after you save.
            </Typography>
            <Button
              variant="contained"
              onClick={saveProfile}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} /> : undefined}
            >
              {saving ? "Saving" : "Save changes"}
            </Button>
          </div>
        </section>
      </div>

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
