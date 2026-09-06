"use client";

import { useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import PhotoCameraOutlined from "@mui/icons-material/PhotoCameraOutlined";
import CheckRounded from "@mui/icons-material/CheckRounded";
import {
  WALLPAPER_REQUIREMENTS,
  formatBytes,
  type PreparedWallpaper,
} from "@/lib/wallpaper";
import { prepareWallpaper, releaseWallpaper } from "@/lib/wallpaper-browser";

/**
 * Pick, preview, then save. Nothing is uploaded until "Use this wallpaper",
 * and the parent gets the prepared image first through onPreview so its own
 * live preview can show it in place. Shared by the dashboard's Design panel
 * and the setup wizard.
 */
export function WallpaperUploader({
  currentUrl,
  busy = false,
  onPreview,
  onSave,
  onRemove,
}: {
  currentUrl?: string | null;
  busy?: boolean;
  onPreview: (prepared: PreparedWallpaper | null) => void;
  /** Uploads and persists. Throw to keep the pending image and show the message. */
  onSave: (prepared: PreparedWallpaper) => Promise<void>;
  onRemove?: () => Promise<void>;
}) {
  const [pending, setPending] = useState<PreparedWallpaper | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearPending() {
    releaseWallpaper(pending);
    setPending(null);
    onPreview(null);
  }

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setPreparing(true);
    try {
      const prepared = await prepareWallpaper(file);
      releaseWallpaper(pending);
      setPending(prepared);
      onPreview(prepared);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That image could not be used.");
    } finally {
      setPreparing(false);
    }
  }

  async function save() {
    if (!pending) return;
    setError(null);
    try {
      await onSave(pending);
      clearPending();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed. Try again.");
    }
  }

  const thumbUrl = pending?.previewUrl ?? currentUrl ?? null;
  const working = busy || preparing;

  return (
    <div className="wallpaper-uploader">
      <span className="wallpaper-uploader__thumb" aria-hidden="true">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- object URL or storage URL, no optimisation possible
          <img src={thumbUrl} alt="" />
        ) : (
          <Typography variant="caption">No wallpaper</Typography>
        )}
      </span>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={850}>Your wallpaper</Typography>
        <ul className="wallpaper-uploader__requirements">
          {WALLPAPER_REQUIREMENTS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {pending && (
          <div className="wallpaper-uploader__pending" role="status">
            <Typography variant="body2" fontWeight={700}>
              {pending.width} × {pending.height} · {formatBytes(pending.bytes)}
              {pending.scaled || pending.reencoded ? (
                <Typography component="span" variant="body2" color="text.secondary">
                  {" "}
                  (shrunk from {formatBytes(pending.originalBytes)})
                </Typography>
              ) : null}
            </Typography>
            {pending.warnings.map((warning) => (
              <Alert severity="warning" key={warning} sx={{ mt: 1 }}>
                {warning}
              </Alert>
            ))}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Check the preview, then save it or choose another.
            </Typography>
          </div>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 1.25 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.25 }}>
          {pending ? (
            <>
              <Button
                variant="contained"
                onClick={() => void save()}
                disabled={working}
                startIcon={busy ? <CircularProgress size={16} /> : <CheckRounded />}
              >
                Use this wallpaper
              </Button>
              <Button component="label" variant="outlined" disabled={working}>
                Choose another
                <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} />
              </Button>
              <Button color="inherit" onClick={clearPending} disabled={working}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                component="label"
                variant="outlined"
                disabled={working}
                startIcon={preparing ? <CircularProgress size={16} /> : <PhotoCameraOutlined />}
              >
                {currentUrl ? "Replace wallpaper" : "Choose an image"}
                <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} />
              </Button>
              {currentUrl && onRemove && (
                <Button
                  color="inherit"
                  disabled={working}
                  onClick={() => {
                    setError(null);
                    onRemove().catch((cause: unknown) =>
                      setError(cause instanceof Error ? cause.message : "Could not remove it."),
                    );
                  }}
                >
                  Remove
                </Button>
              )}
            </>
          )}
        </Stack>
      </Box>
    </div>
  );
}
