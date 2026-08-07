"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import QRCode from "qrcode";
import { publicProfileUrl } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

/**
 * The screen you hold up at an event. One job: be scannable from across a
 * table in one tap, and let you name where you are without leaving it.
 *
 * Everything else the dashboard offers is deliberately absent.
 */
export function EventCardScreen({
  profileId,
  username,
  displayName,
  initialEventTag,
}: {
  profileId: string;
  username: string;
  displayName: string;
  initialEventTag: string;
}) {
  const profileUrl = publicProfileUrl(username);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [eventTag, setEventTag] = useState(initialEventTag);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialEventTag);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    message: string;
  } | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(profileUrl, {
      width: 1080,
      margin: 1,
      // Highest correction level: this code gets scanned at an angle, in bad
      // light, sometimes through a phone case.
      errorCorrectionLevel: "H",
      // Fixed black on white rather than the page theme. A themed code on a
      // low-contrast pair is the standard way to make one unscannable.
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) {
          setNotice({
            severity: "error",
            message: "The code could not be generated. Reload the page.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [profileUrl]);

  /**
   * Hold the screen awake. A phone dimming to black halfway through someone
   * lining up a scan is the single most annoying failure here. Brightness
   * itself is not reachable from a web page -- only sleep is.
   */
  useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    if (!nav.wakeLock) return;

    let released = false;
    async function acquire() {
      try {
        const sentinel = await nav.wakeLock!.request("screen");
        if (released) {
          void sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
      } catch {
        // Denied, or the tab is backgrounded. The screen just sleeps normally.
      }
    }

    // The lock drops whenever the tab is hidden, so take it again on return.
    function onVisibility() {
      if (document.visibilityState === "visible") void acquire();
    }

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);

  const saveEventTag = useCallback(
    async (next: string) => {
      setSaving(true);
      const { error } = await createClient()
        .from("profiles")
        .update({ current_event_tag: next || null })
        .eq("id", profileId);
      setSaving(false);
      if (error) {
        setNotice({ severity: "error", message: error.message });
        return;
      }
      setEventTag(next);
      setDraft(next);
      setEditing(false);
      setNotice({
        severity: "success",
        message: next ? `Filing contacts under “${next}”.` : "Event mode off.",
      });
    },
    [profileId],
  );

  return (
    <main className="event-card">
      <header className="event-card__bar">
        <IconButton
          component={Link}
          href="/dashboard"
          aria-label="Back to dashboard"
          size="small"
        >
          <ArrowBackRounded />
        </IconButton>
        <span className="event-card__handle">{profileUrl.replace("https://", "")}</span>
      </header>

      <div className="event-card__stage">
        <div className="event-card__code">
          {qrDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={qrDataUrl} alt={`QR code linking to ${profileUrl}`} />
          ) : (
            <div className="event-card__code-loading" aria-label="Generating code" />
          )}
        </div>

        <Typography component="h1" className="event-card__name">
          {displayName}
        </Typography>

        <button
          type="button"
          className={`event-card__event${eventTag ? " is-set" : ""}`}
          onClick={() => {
            setDraft(eventTag);
            setEditing(true);
          }}
        >
          <PlaceOutlined fontSize="small" />
          <span>{eventTag || "Name where you are"}</span>
        </button>

        <Typography className="event-card__hint">
          {eventTag
            ? "Everyone who scans this today lands under that name."
            : "Set an event and today’s contacts arrive already grouped."}
        </Typography>
      </div>

      <Dialog open={editing} onClose={() => setEditing(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          Event mode
          <IconButton
            onClick={() => setEditing(false)}
            aria-label="Close"
            size="small"
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseRounded fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Contacts you collect are stamped with this until you clear it.
          </Typography>
          <TextField
            label="Where are you?"
            placeholder="SaaStr 2026 — Tuesday mixer"
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 80))}
            fullWidth
            autoFocus
            disabled={saving}
          />
        </DialogContent>
        <DialogActions>
          {eventTag && (
            <Button
              color="inherit"
              onClick={() => saveEventTag("")}
              disabled={saving}
              sx={{ mr: "auto" }}
            >
              End event
            </Button>
          )}
          <Button color="inherit" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => saveEventTag(draft.trim())}
            disabled={saving || draft.trim() === eventTag}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={2600}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {notice ? (
          <Alert severity={notice.severity} variant="filled" onClose={() => setNotice(null)}>
            {notice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </main>
  );
}
