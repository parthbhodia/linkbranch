"use client";

import { useMemo, useState } from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  getSocialPlatformIcon,
  getSocialPlatformOption,
  socialPlatformOptions,
} from "@/lib/social-platforms";
import { createClient } from "@/lib/supabase/client";

export type SettingsSocial = {
  id: number;
  platform: string;
  url: string;
};

function normalizeHttpUrl(value: string) {
  const candidate = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export function SettingsConnectEditor({
  profileId,
  initialSocials,
  onSaved,
}: {
  profileId: string;
  initialSocials: Array<{ platform: string; url: string; position: number }>;
  onSaved: (
    socials: Array<{ platform: string; url: string; position: number }>,
  ) => void;
}) {
  const [socials, setSocials] = useState<SettingsSocial[]>(() =>
    initialSocials.map((item, index) => ({
      id: index + 1,
      platform: item.platform,
      url: item.url,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unusedPlatforms = useMemo(
    () =>
      socialPlatformOptions.filter(
        (platform) =>
          !socials.some((item) => item.platform === platform.label),
      ),
    [socials],
  );

  function addSocial(platform?: string) {
    const nextPlatform = platform ?? unusedPlatforms[0]?.label;
    if (!nextPlatform) return;
    setSocials((current) => [
      ...current,
      {
        id: Math.max(0, ...current.map((item) => item.id)) + 1,
        platform: nextPlatform,
        url: "",
      },
    ]);
  }

  function updateSocial(
    id: number,
    field: "platform" | "url",
    value: string,
  ) {
    setSocials((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function removeSocial(id: number) {
    setSocials((current) => current.filter((item) => item.id !== id));
  }

  async function saveSocials() {
    const completed = socials.filter(
      (item) => item.platform.trim() && item.url.trim(),
    );
    if (
      socials.some(
        (item) =>
          (item.platform.trim() || item.url.trim()) &&
          (!item.platform.trim() || !item.url.trim()),
      )
    ) {
      setError("Complete both the platform and URL for every social profile.");
      return;
    }

    const normalized = completed.map((item) => {
      const url = normalizeHttpUrl(item.url);
      return url ? { platform: item.platform.trim(), url } : null;
    });
    if (normalized.some((item) => !item)) {
      setError("Use a valid http(s) URL for every social profile.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("social_links")
      .delete()
      .eq("user_id", profileId);
    if (deleteError) {
      setSaving(false);
      setError(deleteError.message);
      return;
    }

    const rows = (normalized as Array<{ platform: string; url: string }>).map(
      (item, index) => ({
        user_id: profileId,
        platform: item.platform,
        url: item.url,
        position: index,
      }),
    );

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("social_links")
        .insert(rows);
      if (insertError) {
        setSaving(false);
        setError(insertError.message);
        return;
      }
    }

    onSaved(
      rows.map(({ platform, url, position }) => ({ platform, url, position })),
    );
    setSaving(false);
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        useFlexGap
        flexWrap="wrap"
      >
        <Typography variant="body2" color="text.secondary">
          Optional. These show as icons on your public page.
        </Typography>
        <Button
          startIcon={<AddRounded />}
          onClick={() => addSocial()}
          disabled={unusedPlatforms.length === 0 || saving}
        >
          Add social
        </Button>
      </Stack>

      <Stack spacing={1.5}>
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
                disabled={saving}
              >
                {!option && (
                  <MenuItem value={item.platform}>{item.platform}</MenuItem>
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
                placeholder={option?.placeholder ?? "https://example.com/profile"}
                value={item.url}
                onChange={(event) =>
                  updateSocial(item.id, "url", event.target.value)
                }
                onBlur={() => {
                  const normalized = normalizeHttpUrl(item.url);
                  if (normalized) updateSocial(item.id, "url", normalized);
                }}
                fullWidth
                disabled={saving}
                slotProps={{
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
                  disabled={saving}
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </Tooltip>
            </Box>
          );
        })}

        {socials.length === 0 && (
          <Box className="social-profile-empty">
            <Typography fontWeight={800}>No social profiles yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Add Instagram, YouTube, LinkedIn, or any network that helps people
              find you.
            </Typography>
          </Box>
        )}
      </Stack>

      {unusedPlatforms.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {unusedPlatforms.slice(0, 6).map((platform) => (
            <Button
              key={platform.label}
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={platform.icon}
              onClick={() => addSocial(platform.label)}
              disabled={saving}
            >
              {platform.label}
            </Button>
          ))}
        </Stack>
      )}

      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}

      <Button
        variant="contained"
        onClick={saveSocials}
        disabled={saving}
        startIcon={saving ? <CircularProgress size={16} /> : undefined}
        sx={{ alignSelf: "flex-start" }}
      >
        {saving ? "Saving socials…" : "Save socials"}
      </Button>
    </Stack>
  );
}
