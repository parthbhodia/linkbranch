"use client";

import { useEffect, useMemo, useState } from "react";
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
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import QRCode from "qrcode";
import { publicProfileUrl } from "@/lib/brand";

type ShareFormat = "square" | "poster";
type ShareThemeId = "paper" | "signal" | "blush";

type ShareTheme = {
  id: ShareThemeId;
  label: string;
  background: string;
  surface: string;
  ink: string;
  accent: string;
};

const shareThemes: ShareTheme[] = [
  {
    id: "paper",
    label: "Field notes",
    background: "#f4f2e8",
    surface: "#fffef8",
    ink: "#20221c",
    accent: "#cde64f",
  },
  {
    id: "signal",
    label: "Night signal",
    background: "#171b2c",
    surface: "#f8f2e7",
    ink: "#171b2c",
    accent: "#ffcc54",
  },
  {
    id: "blush",
    label: "Soft focus",
    background: "#f2dfe8",
    surface: "#fff8fb",
    ink: "#492536",
    accent: "#e96397",
  },
];

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  color: string,
  spacing: number,
) {
  context.save();
  context.globalAlpha = 0.09;
  context.strokeStyle = color;
  context.lineWidth = 2;
  for (let x = 0; x <= width; x += spacing) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += spacing) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();
}

function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

// Two lines of display type on the card; beyond this it is trimmed anyway.
const HEADING_MAX = 70;

const DEFAULT_HEADINGS: Record<ShareFormat, string> = {
  square: "All my useful links, one scan.",
  poster: "SCAN FOR MY LINKS",
};

// The card art gives the heading two lines. Custom text is any length, so fold
// it on word boundaries and clip the overflow rather than letting it run off
// the card or overlap the QR below it.
function wrapHeading(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    // `!current` keeps a single over-long word rather than dropping it.
    if (!current || context.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);

  const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumed < words.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1]}…`;
  }

  return lines;
}

async function exportShareAsset({
  format,
  theme,
  qrDataUrl,
  displayName,
  username,
  profileUrl,
  heading,
}: {
  format: ShareFormat;
  theme: ShareTheme;
  qrDataUrl: string;
  displayName: string;
  username: string;
  profileUrl: string;
  heading: string;
}) {
  const isSquare = format === "square";
  const width = isSquare ? 1080 : 1240;
  const height = isSquare ? 1080 : 1754;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  context.fillStyle = theme.background;
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height, theme.ink, isSquare ? 72 : 84);

  const horizontalPadding = isSquare ? 76 : 96;
  const brandY = isSquare ? 86 : 110;
  context.fillStyle = theme.accent;
  context.beginPath();
  context.arc(horizontalPadding + 17, brandY - 13, 16, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = theme.id === "signal" ? theme.surface : theme.ink;
  context.font = "900 38px 'Avenir Next', Avenir, sans-serif";
  context.fillText("cueful.", horizontalPadding + 48, brandY);

  const cardX = horizontalPadding;
  const cardWidth = width - horizontalPadding * 2;
  const cardY = isSquare ? 154 : 270;
  const cardHeight = isSquare ? 838 : 1320;
  roundedRect(context, cardX, cardY, cardWidth, cardHeight, isSquare ? 52 : 64);
  context.fillStyle = theme.surface;
  context.fill();
  context.strokeStyle = `${theme.ink}2a`;
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = theme.ink;
  context.font = `900 ${isSquare ? 66 : 82}px 'Avenir Next', Avenir, sans-serif`;
  const headingLines = wrapHeading(context, heading, cardWidth - 120);
  const headingLeading = isSquare ? 72 : 92;
  headingLines.forEach((line, index) => {
    context.fillText(line, cardX + 60, cardY + 102 + index * headingLeading);
  });

  context.fillStyle = theme.ink;
  context.globalAlpha = 0.66;
  context.font = `600 ${isSquare ? 28 : 34}px 'Avenir Next', Avenir, sans-serif`;
  context.fillText(displayName, cardX + 62, cardY + (isSquare ? 236 : 270));
  context.globalAlpha = 1;

  const qrImage = await loadCanvasImage(qrDataUrl);
  const qrSize = isSquare ? 420 : 650;
  const qrX = cardX + (cardWidth - qrSize) / 2;
  const qrY = cardY + (isSquare ? 292 : 390);
  context.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  const pillWidth = isSquare ? 660 : 810;
  const pillHeight = isSquare ? 78 : 96;
  const pillX = cardX + (cardWidth - pillWidth) / 2;
  const pillY = qrY + qrSize + (isSquare ? 42 : 76);
  roundedRect(context, pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
  context.fillStyle = theme.accent;
  context.fill();
  context.fillStyle = theme.ink;
  context.font = `800 ${isSquare ? 25 : 31}px 'SFMono-Regular', Consolas, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(profileUrl.replace("https://", ""), width / 2, pillY + pillHeight / 2);

  context.fillStyle = theme.id === "signal" ? theme.surface : theme.ink;
  context.globalAlpha = 0.72;
  context.font = `700 ${isSquare ? 22 : 27}px 'SFMono-Regular', Consolas, monospace`;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillText(`@${username}`, horizontalPadding, height - (isSquare ? 40 : 76));
  context.textAlign = "right";
  context.fillText("ONE PAGE · BETTER CLICKS", width - horizontalPadding, height - (isSquare ? 40 : 76));
  context.globalAlpha = 1;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Export failed"))),
      "image/png",
      1,
    );
  });
  downloadBlob(blob, `cueful-${username}-${format}.png`);
}

export function ShareDialog({
  open,
  onClose,
  username,
  displayName,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  displayName: string;
}) {
  const profileUrl = publicProfileUrl(username);
  const [format, setFormat] = useState<ShareFormat>("square");
  // Per-format, so switching between the square post and the poster does not
  // carry sentence-case copy onto a card whose art is set in caps. Blank means
  // "use the default", which is also how clearing the field restores it.
  const [headings, setHeadings] = useState<Partial<Record<ShareFormat, string>>>(
    {},
  );
  const [themeId, setThemeId] = useState<ShareThemeId>("paper");
  const heading = headings[format]?.trim() || DEFAULT_HEADINGS[format];
  const [qrAsset, setQrAsset] = useState<{
    themeId: ShareThemeId | "";
    png: string;
    svg: string;
  }>({ themeId: "", png: "", svg: "" });
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const theme = useMemo(
    () => shareThemes.find((item) => item.id === themeId) ?? shareThemes[0],
    [themeId],
  );
  const qrDataUrl = qrAsset.themeId === themeId ? qrAsset.png : "";
  const qrSvgDataUrl = qrAsset.themeId === themeId ? qrAsset.svg : "";

  useEffect(() => {
    if (!open) return;

    const options = {
      margin: 3,
      errorCorrectionLevel: "M" as const,
      color: {
        dark: theme.ink,
        light: theme.surface,
      },
    };

    void Promise.all([
      QRCode.toDataURL(profileUrl, { ...options, width: 720 }),
      QRCode.toString(profileUrl, { ...options, type: "svg" }),
    ])
      .then(([png, svg]) =>
        setQrAsset({
          themeId: theme.id,
          png,
          svg: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
        }),
      )
      .catch(() =>
        setNotice({
          message: "QR code could not be generated",
          severity: "error",
        }),
      );
  }, [open, profileUrl, theme]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setNotice({ message: "Profile link copied", severity: "success" });
    } catch {
      setNotice({ message: "The link could not be copied", severity: "error" });
    }
  }

  async function shareProfile() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} on Cueful`,
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

  async function downloadShareAsset() {
    if (!qrDataUrl) return;
    setExporting(true);
    try {
      await exportShareAsset({
        format,
        theme,
        qrDataUrl,
        displayName,
        username,
        profileUrl,
        heading,
      });
      setNotice({
        message: `${format === "square" ? "Square post" : "Poster"} downloaded`,
        severity: "success",
      });
    } catch {
      setNotice({ message: "The share asset could not be exported", severity: "error" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { className: "share-dialog" } }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <QrCode2Rounded />
            <Box>
              <Typography component="span" variant="h6">
                Share kit
              </Typography>
              <Typography component="p" variant="body2" color="text.secondary">
                Make your profile easy to find online or out in the world.
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <div className="share-kit">
            <Stack className="share-kit__controls" spacing={3}>
              <Box>
                <Typography className="share-kit__label">FORMAT</Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={format}
                  onChange={(_, value: ShareFormat | null) => value && setFormat(value)}
                  aria-label="Share asset format"
                >
                  <ToggleButton value="square">Square post</ToggleButton>
                  <ToggleButton value="poster">Print poster</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography className="share-kit__label" component="label" htmlFor="share-heading">
                  HEADING
                </Typography>
                <TextField
                  id="share-heading"
                  fullWidth
                  size="small"
                  multiline
                  maxRows={3}
                  value={headings[format] ?? ""}
                  placeholder={DEFAULT_HEADINGS[format]}
                  onChange={(event) =>
                    setHeadings((current) => ({
                      ...current,
                      [format]: event.target.value.slice(0, HEADING_MAX),
                    }))
                  }
                  helperText={
                    headings[format]?.trim()
                      ? `${headings[format]?.length ?? 0}/${HEADING_MAX} · clear to restore the default`
                      : "Fits two lines on the card. Longer text is trimmed."
                  }
                />
              </Box>

              <Box>
                <Typography className="share-kit__label">COLOR</Typography>
                <div className="share-kit__themes">
                  {shareThemes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`share-kit__theme${themeId === item.id ? " is-selected" : ""}`}
                      aria-pressed={themeId === item.id}
                      onClick={() => setThemeId(item.id)}
                    >
                      <span
                        className="share-kit__theme-swatch"
                        style={{
                          background: `linear-gradient(135deg, ${item.background} 0 64%, ${item.accent} 64%)`,
                        }}
                      />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </Box>

              <Box className="share-kit__direct">
                <Typography className="share-kit__label">DIRECT LINK</Typography>
                <Typography>{profileUrl.replace("https://", "")}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button size="small" startIcon={<ContentCopyRounded />} onClick={copyUrl}>
                    Copy
                  </Button>
                  <Button size="small" startIcon={<IosShareRounded />} onClick={shareProfile}>
                    Share
                  </Button>
                  <Button
                    size="small"
                    component="a"
                    href={qrDataUrl}
                    download={`cueful-${username}-qr.png`}
                    startIcon={<QrCode2Rounded />}
                    disabled={!qrDataUrl}
                  >
                    QR PNG
                  </Button>
                  <Button
                    size="small"
                    component="a"
                    href={qrSvgDataUrl}
                    download={`cueful-${username}-qr.svg`}
                    startIcon={<QrCode2Rounded />}
                    disabled={!qrSvgDataUrl}
                  >
                    QR SVG
                  </Button>
                </Stack>
              </Box>

              <Alert severity="info" icon={<QrCode2Rounded />}>
                Keep the QR code high-contrast and leave its clear border intact for reliable scans.
              </Alert>
            </Stack>

            <div className="share-kit__stage">
              <div
                className={`share-kit__preview share-kit__preview--${format}`}
                style={
                  {
                    "--share-bg": theme.background,
                    "--share-surface": theme.surface,
                    "--share-ink": theme.ink,
                    "--share-accent": theme.accent,
                    "--share-outer-ink":
                      theme.id === "signal" ? theme.surface : theme.ink,
                  } as React.CSSProperties
                }
              >
                <div className="share-kit__brand"><i />cueful.</div>
                <div className="share-kit__card">
                  <Typography component="strong">{heading}</Typography>
                  <Typography component="span">{displayName}</Typography>
                  <div className="share-kit__qr">
                    {qrDataUrl ? (
                      <Box
                        component="img"
                        src={qrDataUrl}
                        alt={`QR code for ${profileUrl}`}
                      />
                    ) : (
                      <span aria-label="Generating QR code" />
                    )}
                  </div>
                  <div className="share-kit__pill">
                    {profileUrl.replace("https://", "")}
                  </div>
                </div>
                <div className="share-kit__footer">
                  <span>@{username}</span>
                  <span>ONE PAGE · BETTER CLICKS</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadRounded />}
            onClick={downloadShareAsset}
            disabled={!qrDataUrl || exporting}
          >
            {exporting
              ? "Preparing…"
              : `Download ${format === "square" ? "square PNG" : "poster PNG"}`}
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
