"use client";

import { useState } from "react";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import EmailRounded from "@mui/icons-material/EmailRounded";
import FacebookRounded from "@mui/icons-material/FacebookRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import LinkedIn from "@mui/icons-material/LinkedIn";
import LinkRounded from "@mui/icons-material/LinkRounded";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import MusicNoteRounded from "@mui/icons-material/MusicNoteRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import WhatsApp from "@mui/icons-material/WhatsApp";
import X from "@mui/icons-material/X";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import { detectBookingProvider } from "@/lib/booking-providers";
import { detectLinkBrand } from "@/lib/link-brands";
import {
  linkShareTargets,
  shortenShareUrl,
  type ShareTargetId,
} from "@/lib/link-sharing";
import { detectMusicProvider } from "@/lib/music-providers";
import { readableForeground } from "@/lib/theme-config";

export type ShareableLink = {
  id: number | string;
  title: string;
  url: string;
  subtitle?: string | null;
  thumbnailUrl?: string | null;
  /** The link's own fill, which the preview card wears. */
  color?: string | null;
  featured?: boolean;
};

export type SheetNotice = {
  message: string;
  severity: "success" | "error" | "info";
};

const targetIcons: Record<ShareTargetId, React.ReactNode> = {
  x: <X />,
  facebook: <FacebookRounded />,
  whatsapp: <WhatsApp />,
  linkedin: <LinkedIn />,
  email: <EmailRounded />,
};

/** Past this the description is clamped, with a More button to open it. */
const DESCRIPTION_LIMIT = 140;

/** The card's fill when a link carries neither a brand nor its own colour. */
const PREVIEW_FALLBACK = "#eceae2";

/**
 * The share sheet behind the dots on a link.
 *
 * A dot on every row rather than a share button on hover, because the page is
 * read on a phone where there is no hover to discover it. Copy link is first
 * and is the only entry with no destination: it is the one people reach for
 * when the place they want to send this has no share endpoint at all.
 */
export function LinkShareSheet({
  link,
  onClose,
  onNotice,
}: {
  link: ShareableLink;
  onClose: () => void;
  onNotice: (notice: SheetNotice) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Read during render rather than in an effect: the sheet only mounts after a
  // click, so this never runs on the server, and setting state from an effect
  // would cost a second render just to add one button.
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const targets = linkShareTargets({ url: link.url, title: link.title });
  const description = (link.subtitle ?? "").trim();
  const truncatable = description.length > DESCRIPTION_LIMIT;

  const music = detectMusicProvider(link.url);
  const booking = music ? null : detectBookingProvider(link.url);
  const brand = music || booking ? null : detectLinkBrand(link.url);

  // The card wears the link's own colour instead of a grey box, so the sheet
  // reads as a larger version of the tile the visitor just tapped. The ink is
  // picked against that fill, because a pastel like #ffd166 would swallow a
  // white title.
  const background = brand?.color ?? link.color ?? PREVIEW_FALLBACK;
  const ink = readableForeground(background);

  // With no photo there is still something to show: the same mark the row
  // draws, at tile size, so the card never has a hole where an image would be.
  const mark = music ? (
    <MusicNoteRounded fontSize="inherit" />
  ) : booking ? (
    booking.icon
  ) : brand ? (
    brand.icon
  ) : link.featured ? (
    <StarRounded fontSize="inherit" />
  ) : (
    <LinkRounded fontSize="inherit" />
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link.url);
      onNotice({ message: "Link copied", severity: "success" });
    } catch {
      // Clipboard access is denied in some in-app browsers, where the page is
      // most often opened. Showing the address is better than failing silently.
      onNotice({ message: link.url, severity: "info" });
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: link.title, url: link.url });
    } catch (error) {
      // Cancelling is not a failure, and browsers surface it as AbortError.
      if ((error as Error)?.name === "AbortError") return;
      await copyLink();
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      className="share-sheet"
      aria-labelledby="share-sheet-heading"
    >
      <div className="share-sheet__head">
        <Typography id="share-sheet-heading" component="h2" variant="h3">
          Share link
        </Typography>
        <Tooltip title="Close" arrow>
          <IconButton onClick={onClose} aria-label="Close share sheet">
            <CloseRounded />
          </IconButton>
        </Tooltip>
      </div>

      <DialogContent className="share-sheet__body">
        <div className="share-sheet__preview" style={{ background, color: ink }}>
          {link.thumbnailUrl ? (
            <Box
              component="img"
              className="share-sheet__image"
              src={link.thumbnailUrl}
              alt=""
            />
          ) : (
            <span className="share-sheet__mark" aria-hidden="true">
              {mark}
            </span>
          )}
          <Typography component="p" className="share-sheet__title">
            {link.title}
          </Typography>
          <Typography component="p" className="share-sheet__url">
            {shortenShareUrl(link.url)}
          </Typography>
          {description ? (
            <Typography
              component="p"
              className={`share-sheet__description${expanded ? " is-expanded" : ""}`}
            >
              {description}
            </Typography>
          ) : null}
          {truncatable ? (
            <Button
              className="share-sheet__more"
              size="small"
              variant="outlined"
              aria-expanded={expanded}
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? "Less" : "More"}
            </Button>
          ) : null}
        </div>

        <div className="share-sheet__targets">
          <button
            type="button"
            className="share-sheet__target share-sheet__target--copy"
            onClick={copyLink}
          >
            <span className="share-sheet__target-icon">
              <ContentCopyRounded />
            </span>
            <span className="share-sheet__target-label">Copy link</span>
          </button>
          {targets.map((target) => (
            <a
              key={target.id}
              className={`share-sheet__target share-sheet__target--${target.id}`}
              href={target.href}
              target="_blank"
              rel="noreferrer"
            >
              <span className="share-sheet__target-icon">
                {targetIcons[target.id]}
              </span>
              <span className="share-sheet__target-label">{target.label}</span>
            </a>
          ))}
          {canNativeShare ? (
            <button
              type="button"
              className="share-sheet__target share-sheet__target--more"
              onClick={nativeShare}
            >
              <span className="share-sheet__target-icon">
                <IosShareRounded />
              </span>
              <span className="share-sheet__target-label">More</span>
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** The dots themselves. Shared so the row and its card draw the same control. */
export function ShareLinkButton({
  label,
  onShare,
}: {
  label: string;
  onShare: () => void;
}) {
  return (
    <Tooltip title="Share this link" arrow>
      <IconButton
        className="link-card__more"
        size="small"
        aria-label={`Share ${label}`}
        onClick={onShare}
      >
        <MoreVertRounded fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
