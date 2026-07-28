"use client";

import { useEffect, useMemo, useState } from "react";
import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import BoltRounded from "@mui/icons-material/BoltRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  imageExtension,
  publicAssetUrl,
  PUBLIC_ASSET_BUCKET,
  validateImage,
} from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

export type DashboardHighlight = {
  id: number;
  image_path: string;
  title: string;
  destination_url: string | null;
  position: number;
  expires_at: string;
};

export function HighlightsEditor({
  profileId,
  initialHighlights,
}: {
  profileId: string;
  initialHighlights: DashboardHighlight[];
}) {
  const [highlights, setHighlights] = useState(initialHighlights);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [now] = useState(() => Date.now());
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);

  const activeHighlights = useMemo(
    () =>
      highlights.filter(
        (item) => new Date(item.expires_at).getTime() > now,
      ),
    [highlights, now],
  );
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  async function publishHighlight() {
    if (!file) {
      setNotice({ severity: "error", message: "Choose a vertical image first." });
      return;
    }
    const validation = validateImage(file);
    if (validation) {
      setNotice({ severity: "error", message: validation });
      return;
    }
    const destination = url.trim();
    if (destination && !/^https?:\/\//i.test(destination)) {
      setNotice({
        severity: "error",
        message: "The optional link must begin with http:// or https://.",
      });
      return;
    }
    if (activeHighlights.length >= 5) {
      setNotice({
        severity: "error",
        message: "You can keep up to five highlights live at once.",
      });
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${profileId}/highlights/${crypto.randomUUID()}.${imageExtension(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_ASSET_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setUploading(false);
      setNotice({ severity: "error", message: uploadError.message });
      return;
    }

    const { data, error } = await supabase
      .from("profile_highlights")
      .insert({
        user_id: profileId,
        image_path: path,
        title: title.trim(),
        destination_url: destination || null,
        position: activeHighlights.length,
      })
      .select("id,image_path,title,destination_url,position,expires_at")
      .single();
    if (error || !data) {
      await supabase.storage.from(PUBLIC_ASSET_BUCKET).remove([path]);
      setUploading(false);
      setNotice({
        severity: "error",
        message: error?.message ?? "Could not publish that highlight.",
      });
      return;
    }

    setHighlights((current) => [...current, data]);
    setFile(null);
    setTitle("");
    setUrl("");
    setUploading(false);
    setNotice({
      severity: "success",
      message: "Highlight is live for 24 hours.",
    });
  }

  async function deleteHighlight(highlight: DashboardHighlight) {
    const previous = highlights;
    setHighlights((current) =>
      current.filter((item) => item.id !== highlight.id),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("profile_highlights")
      .delete()
      .eq("id", highlight.id)
      .eq("user_id", profileId);
    if (error) {
      setHighlights(previous);
      setNotice({ severity: "error", message: error.message });
      return;
    }
    await supabase.storage
      .from(PUBLIC_ASSET_BUCKET)
      .remove([highlight.image_path]);
    setNotice({ severity: "success", message: "Highlight removed." });
  }

  return (
    <Stack className="workspace-panel highlights-editor" spacing={2}>
      <div className="highlights-editor__hero">
        <Box>
          <Chip label="STORIES" size="small" variant="outlined" />
          <Typography variant="h2">Highlights</Typography>
          <Typography color="text.secondary">
            Up to five live updates. Each expires after 24 hours.
          </Typography>
        </Box>
        <div className="highlights-editor__meter">
          <span>
            <b>{activeHighlights.length}</b>/5 active
          </span>
          <LinearProgress
            variant="determinate"
            value={(activeHighlights.length / 5) * 100}
          />
        </div>
      </div>

      <Paper className="highlight-composer" variant="outlined">
        <div className="highlight-composer__heading">
          <AddPhotoAlternateOutlined />
          <Box>
            <Typography variant="h3">New highlight</Typography>
            <Typography variant="body2" color="text.secondary">
              Vertical image · title and link optional
            </Typography>
          </Box>
        </div>
        <div className="highlight-composer__fields">
          <Button
            component="label"
            className="highlight-composer__upload"
            variant="outlined"
            sx={
              previewUrl
                ? { backgroundImage: `url("${previewUrl}")` }
                : undefined
            }
          >
            {!previewUrl && (
              <>
                <AddPhotoAlternateOutlined />
                Upload
              </>
            )}
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </Button>
          <Stack spacing={1.5}>
            <TextField
              label="Title (optional)"
              placeholder="New drop"
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 60))}
            />
            <TextField
              label="Link URL (optional)"
              placeholder="https://…"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
            <Button
              variant="contained"
              startIcon={
                uploading ? <CircularProgress size={16} /> : <BoltRounded />
              }
              onClick={publishHighlight}
              disabled={uploading || activeHighlights.length >= 5}
            >
              {uploading ? "Publishing…" : "Post highlight"}
            </Button>
          </Stack>
        </div>
      </Paper>

      <Paper className="active-highlights" variant="outlined">
        <div className="highlight-composer__heading">
          <BoltRounded />
          <Box>
            <Typography variant="h3">Active highlights</Typography>
            <Typography variant="body2" color="text.secondary">
              {activeHighlights.length
                ? `${activeHighlights.length} live now`
                : "Nothing live yet"}
            </Typography>
          </Box>
        </div>
        {activeHighlights.length ? (
          <div className="active-highlights__grid">
            {activeHighlights.map((highlight) => {
              const hoursLeft = Math.max(
                1,
                Math.ceil(
                  (new Date(highlight.expires_at).getTime() - now) /
                    3_600_000,
                ),
              );
              return (
                <article key={highlight.id}>
                  <Box
                    component="img"
                    src={publicAssetUrl(highlight.image_path)}
                    alt={highlight.title || "Profile highlight"}
                  />
                  <div>
                    <Typography fontWeight={850}>
                      {highlight.title || "Untitled highlight"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {hoursLeft}h left
                    </Typography>
                  </div>
                  {highlight.destination_url && (
                    <Tooltip title="Open link">
                      <IconButton
                        component="a"
                        href={highlight.destination_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${highlight.title || "highlight"} link`}
                      >
                        <OpenInNewRounded />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton
                      color="error"
                      onClick={() => deleteHighlight(highlight)}
                      aria-label={`Delete ${highlight.title || "highlight"}`}
                    >
                      <DeleteOutlineRounded />
                    </IconButton>
                  </Tooltip>
                </article>
              );
            })}
          </div>
        ) : (
          <Box className="workspace-empty active-highlights__empty">
            <BoltRounded />
            <Typography variant="h3">No highlights yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Post a new drop, event, announcement, or limited-time offer.
            </Typography>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3200}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {notice ? (
          <Alert
            severity={notice.severity}
            variant="filled"
            onClose={() => setNotice(null)}
          >
            {notice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Stack>
  );
}
