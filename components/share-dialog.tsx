"use client";

import { useEffect, useState } from "react";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import QrCode2Rounded from "@mui/icons-material/QrCode2Rounded";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import QRCode from "qrcode";
import { BRAND_URL } from "@/lib/brand";

export function ShareDialog({
  open,
  onClose,
  username,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
}) {
  const profileUrl = `${BRAND_URL}/u/${encodeURIComponent(username)}`;
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!open) return;

    void QRCode.toDataURL(profileUrl, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#20221c",
        light: "#faf9f1",
      },
    })
      .then(setQrDataUrl)
      .catch(() =>
        setNotice({
          message: "QR code could not be generated",
          severity: "error",
        }),
      );
  }, [open, profileUrl]);

  async function copyUrl() {
    await navigator.clipboard.writeText(profileUrl);
    setNotice({ message: "Profile link copied", severity: "success" });
  }

  async function shareProfile() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username} on Cueful`,
          text: "Explore my links and recommendations.",
          url: profileUrl,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setNotice({
          message: "Sharing is unavailable on this device",
          severity: "error",
        });
      }
      return;
    }

    await copyUrl();
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{ className: "share-dialog" }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <QrCode2Rounded />
            <span>Share your page</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box className="share-dialog__qr">
            {qrDataUrl ? (
              <Box component="img" src={qrDataUrl} alt={`QR code for ${profileUrl}`} />
            ) : (
              <span aria-label="Generating QR code" />
            )}
          </Box>
          <Typography className="share-dialog__url">{profileUrl}</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Scan it, add it to a poster, or send the direct link.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<ContentCopyRounded />} onClick={copyUrl}>
            Copy
          </Button>
          <Button
            component="a"
            href={qrDataUrl}
            download={`cueful-${username}-qr.png`}
            startIcon={<DownloadRounded />}
            disabled={!qrDataUrl}
          >
            QR code
          </Button>
          <Button
            variant="contained"
            startIcon={<IosShareRounded />}
            onClick={shareProfile}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={2400}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notice?.severity ?? "success"} onClose={() => setNotice(null)}>
          {notice?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
