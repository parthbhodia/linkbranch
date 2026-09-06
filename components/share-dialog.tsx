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
import { withShareSource, type ShareSource } from "@/lib/share-source";

type ShareFormat = "square" | "poster" | "tent" | "sticker";

/**
 * Each format is scanned from a different surface, so each carries its own
 * tag and the dashboard can say which one is actually working.
 */
const FORMAT_SOURCE: Record<ShareFormat, ShareSource> = {
  square: "square",
  poster: "poster",
  tent: "tent",
  sticker: "sticker",
};

const FORMAT_LABELS: Record<ShareFormat, string> = {
  square: "Square post",
  poster: "Print poster",
  tent: "Table tent",
  sticker: "Sticker sheet",
};

const FORMAT_NOTES: Record<ShareFormat, string> = {
  square: "1080 x 1080 for a feed or a story.",
  poster: "A4 at 150 dpi. Print and pin it up.",
  tent: "A5 folded down the middle: one face for each side of the table.",
  sticker: "Twelve labels on A4. Cut and stick them wherever people queue.",
};
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
  tent: "Scan for our links",
  sticker: "Scan me",
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

/**
 * One readable face of the table tent, drawn at the origin. Called twice: the
 * second time under a 180-degree rotation, so a sheet folded down the middle
 * reads correctly from both sides of a table.
 */
function drawTentFace(
  context: CanvasRenderingContext2D,
  {
    width,
    height,
    theme,
    qrImage,
    heading,
    displayName,
    profileUrl,
  }: {
    width: number;
    height: number;
    theme: ShareTheme;
    qrImage: CanvasImageSource;
    heading: string;
    displayName: string;
    profileUrl: string;
  },
) {
  context.fillStyle = theme.background;
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height, theme.ink, 64);

  const padding = 64;
  const cardWidth = width - padding * 2;
  const cardHeight = height - padding * 2;
  roundedRect(context, padding, padding, cardWidth, cardHeight, 44);
  context.fillStyle = theme.surface;
  context.fill();
  context.strokeStyle = `${theme.ink}2a`;
  context.lineWidth = 3;
  context.stroke();

  const qrSize = Math.min(cardHeight - 190, 400);
  const qrX = padding + 56;
  const qrY = padding + (cardHeight - qrSize) / 2;
  context.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  const textX = qrX + qrSize + 52;
  const textWidth = width - padding - 48 - textX;
  context.fillStyle = theme.ink;
  context.font = "900 62px 'Avenir Next', Avenir, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  const lines = wrapHeading(context, heading, textWidth);
  lines.forEach((line, index) => {
    context.fillText(line, textX, qrY + 76 + index * 70);
  });

  context.globalAlpha = 0.66;
  context.font = "600 30px 'Avenir Next', Avenir, sans-serif";
  context.fillText(displayName, textX, qrY + 76 + lines.length * 70 + 22);
  context.globalAlpha = 1;

  const pillHeight = 76;
  const pillY = qrY + qrSize - pillHeight;
  const pillWidth = Math.min(textWidth, 460);
  roundedRect(context, textX, pillY, pillWidth, pillHeight, pillHeight / 2);
  context.fillStyle = theme.accent;
  context.fill();
  context.fillStyle = theme.ink;
  context.font = "800 26px 'SFMono-Regular', Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(
    profileUrl.replace("https://", ""),
    textX + pillWidth / 2,
    pillY + pillHeight / 2,
  );
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
}

/**
 * A4 folded down the middle. The top half is drawn upside down so that once
 * folded, each side of the table reads a right-way-up face.
 */
function drawTent(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  args: {
    theme: ShareTheme;
    qrImage: CanvasImageSource;
    heading: string;
    displayName: string;
    profileUrl: string;
  },
) {
  const half = height / 2;
  const face = { ...args, width, height: half };

  context.save();
  context.translate(0, half);
  drawTentFace(context, face);
  context.restore();

  context.save();
  context.translate(width, half);
  context.rotate(Math.PI);
  drawTentFace(context, face);
  context.restore();

  // The fold line, dashed so it reads as an instruction rather than a border.
  context.save();
  context.strokeStyle = `${args.theme.ink}55`;
  context.lineWidth = 2;
  context.setLineDash([14, 12]);
  context.beginPath();
  context.moveTo(0, half);
  context.lineTo(width, half);
  context.stroke();
  context.restore();
}

/** Twelve cut-out labels on A4, for counters, packaging and shop windows. */
function drawStickerSheet(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  {
    theme,
    qrImage,
    heading,
    username,
  }: {
    theme: ShareTheme;
    qrImage: CanvasImageSource;
    heading: string;
    username: string;
  },
) {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const columns = 3;
  const rows = 4;
  const margin = 60;
  const cellWidth = (width - margin * 2) / columns;
  const cellHeight = (height - margin * 2) / rows;
  const inset = 14;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = margin + column * cellWidth + inset;
      const y = margin + row * cellHeight + inset;
      const w = cellWidth - inset * 2;
      const h = cellHeight - inset * 2;

      // Cut guide first, so the label art sits on top of it.
      context.save();
      context.strokeStyle = "#c9c9c2";
      context.lineWidth = 2;
      context.setLineDash([9, 9]);
      roundedRect(context, x - inset / 2, y - inset / 2, w + inset, h + inset, 26);
      context.stroke();
      context.restore();

      roundedRect(context, x, y, w, h, 22);
      context.fillStyle = theme.surface;
      context.fill();
      context.strokeStyle = `${theme.ink}22`;
      context.lineWidth = 2;
      context.stroke();

      const qrSize = Math.min(w - 56, h - 116);
      context.drawImage(qrImage, x + (w - qrSize) / 2, y + 24, qrSize, qrSize);

      context.fillStyle = theme.ink;
      context.textAlign = "center";
      context.font = "900 24px 'Avenir Next', Avenir, sans-serif";
      context.fillText(heading, x + w / 2, y + 24 + qrSize + 34, w - 28);
      context.globalAlpha = 0.66;
      context.font = "700 18px 'SFMono-Regular', Consolas, monospace";
      context.fillText(`@${username}`, x + w / 2, y + 24 + qrSize + 62, w - 28);
      context.globalAlpha = 1;
      context.textAlign = "left";
    }
  }
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

  if (format === "tent" || format === "sticker") {
    const image = await loadCanvasImage(qrDataUrl);
    if (format === "tent") {
      drawTent(context, width, height, {
        theme,
        qrImage: image,
        heading,
        displayName,
        profileUrl,
      });
    } else {
      drawStickerSheet(context, width, height, {
        theme,
        qrImage: image,
        heading,
        username,
      });
    }
    const sheet = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Export failed"))),
        "image/png",
        1,
      );
    });
    downloadBlob(sheet, `cueful-${username}-${format}.png`);
    return;
  }

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
    format: ShareFormat | "";
    png: string;
    svg: string;
  }>({ themeId: "", format: "", png: "", svg: "" });
  // Its own code, because the signature is tagged differently from whichever
  // format is selected above and is generated whatever that selection is.
  const [signatureQr, setSignatureQr] = useState("");
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const theme = useMemo(
    () => shareThemes.find((item) => item.id === themeId) ?? shareThemes[0],
    [themeId],
  );
  const assetMatches = qrAsset.themeId === themeId && qrAsset.format === format;
  const qrDataUrl = assetMatches ? qrAsset.png : "";
  const qrSvgDataUrl = assetMatches ? qrAsset.svg : "";

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

    // Each format encodes its own tag, so the dashboard can tell a scan off a
    // table tent from a scan off a poster.
    const taggedUrl = withShareSource(profileUrl, FORMAT_SOURCE[format]);

    void Promise.all([
      QRCode.toDataURL(taggedUrl, { ...options, width: 720 }),
      QRCode.toString(taggedUrl, { ...options, type: "svg" }),
    ])
      .then(([png, svg]) =>
        setQrAsset({
          themeId: theme.id,
          format,
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
  }, [open, profileUrl, theme, format]);

  useEffect(() => {
    if (!open) return;
    void QRCode.toDataURL(withShareSource(profileUrl, "signature"), {
      width: 264,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1b1c18", light: "#ffffff" },
    })
      .then(setSignatureQr)
      .catch(() => setSignatureQr(""));
  }, [open, profileUrl]);

  /**
   * An email signature is pasted, not downloaded, so it goes on the clipboard
   * as HTML with a plain-text alternative for clients that refuse rich paste.
   * The QR is inlined as a data URL: a signature that hotlinks an image gets
   * blocked by most mail clients, and one that references a file gets lost.
   */
  async function copyEmailSignature() {
    if (!signatureQr) return;
    const url = withShareSource(profileUrl, "signature");
    const display = url.replace("https://", "");
    const html = [
      '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif">',
      "<tr>",
      `<td style="padding-right:14px;vertical-align:middle"><img src="${signatureQr}" width="88" height="88" alt="Scan for ${displayName} on Cueful" style="display:block;border:0" /></td>`,
      '<td style="vertical-align:middle;border-left:2px solid #dedfd8;padding-left:14px">',
      `<div style="font-size:15px;font-weight:bold;color:#1b1c18">${displayName}</div>`,
      `<div style="font-size:13px;color:#5e6256;padding-top:2px">All my links, one page</div>`,
      `<div style="font-size:13px;padding-top:4px"><a href="${url}" style="color:#496800;text-decoration:none">${display}</a></div>`,
      "</td></tr></table>",
    ].join("");
    const plain = `${displayName} — all my links, one page: ${url}`;

    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" }),
          }),
        ]);
      } else {
        // Older Safari has no ClipboardItem; the raw markup still pastes into
        // any signature editor that accepts HTML source.
        await navigator.clipboard.writeText(html);
      }
      setNotice({
        message: "Email signature copied. Paste it into your mail signature settings.",
        severity: "success",
      });
    } catch {
      setNotice({
        message: "The signature could not be copied",
        severity: "error",
      });
    }
  }

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
        message: `${FORMAT_LABELS[format]} downloaded`,
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
                  className="share-kit__formats"
                  value={format}
                  onChange={(_, value: ShareFormat | null) => value && setFormat(value)}
                  aria-label="Share asset format"
                >
                  {(Object.keys(FORMAT_LABELS) as ShareFormat[]).map((item) => (
                    <ToggleButton value={item} key={item}>
                      {FORMAT_LABELS[item]}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                  {FORMAT_NOTES[format]}
                </Typography>
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
                      : format === "sticker"
                        ? "One short line on each label. Keep it to a few words."
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
                  <Button
                    size="small"
                    startIcon={<ContentCopyRounded />}
                    onClick={copyEmailSignature}
                    disabled={!signatureQr}
                  >
                    Email signature
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
              {(format === "tent" || format === "sticker") && (
                <Typography variant="caption" className="share-kit__stage-note">
                  {format === "tent"
                    ? "One of the two faces. The sheet prints both, folded down the middle."
                    : "One label. The sheet prints twelve, with cut guides."}
                </Typography>
              )}
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
            {exporting ? "Preparing…" : `Download ${FORMAT_LABELS[format]}`}
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
