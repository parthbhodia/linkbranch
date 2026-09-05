/**
 * Rules for the full-bleed wallpaper behind a page, shared by the dashboard
 * and the setup wizard.
 *
 * The public page paints the image with `background-size: cover`, centred,
 * under a 62-78% tint of the page colour (see .profile-theme-has-wallpaper
 * in globals.css). Two things follow: on a phone only the middle strip of a
 * landscape photo survives, and fine detail or text in the image is wasted.
 * The requirements below say so up front, and the browser-side step in
 * wallpaper-browser.ts shrinks oversized photos rather than rejecting them,
 * because "5 MB max" is a wall every phone camera photo hits.
 */

// Relative on purpose: node's test runner has no idea what "@/" means.
import { MAX_IMAGE_BYTES, SUPPORTED_IMAGE_TYPES } from "./storage.ts";

/** Longest edge kept after shrinking. Twice a phone's CSS width at 2x. */
export const WALLPAPER_MAX_EDGE = 2400;

/** Below this on the short edge, a phone shows visible softening. */
export const WALLPAPER_MIN_SHORT_EDGE = 720;

/** What we accept before shrinking. The saved file must still fit MAX_IMAGE_BYTES. */
export const WALLPAPER_MAX_INPUT_BYTES = 30 * 1024 * 1024;

/** Files over this are re-encoded even when the size in pixels is fine. */
export const WALLPAPER_REENCODE_BYTES = 1.5 * 1024 * 1024;

export const WALLPAPER_RECOMMENDED = { width: 1080, height: 1920 };

/** Shown next to the picker, in both places it appears. */
export const WALLPAPER_REQUIREMENTS: string[] = [
  "JPG, PNG or WebP, up to 30 MB. Big photos are shrunk to fit and the saved file stays under 5 MB.",
  `Portrait works best, at least ${WALLPAPER_RECOMMENDED.width} × ${WALLPAPER_RECOMMENDED.height}. A landscape photo shows only its middle on a phone.`,
  "It sits under a soft tint of your page colour so your name and links stay readable. Pick a photo or texture, not an image with text in it.",
];

export type PreparedWallpaper = {
  /** What gets uploaded: the original, or a shrunk WebP/JPEG. */
  file: File;
  /** Object URL for previews. Revoke it when done. */
  previewUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  bytes: number;
  scaled: boolean;
  reencoded: boolean;
  warnings: string[];
};

export function planWallpaperResize(
  width: number,
  height: number,
): { width: number; height: number; scaled: boolean } {
  const longest = Math.max(width, height);
  if (longest <= WALLPAPER_MAX_EDGE) return { width, height, scaled: false };
  const ratio = WALLPAPER_MAX_EDGE / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
    scaled: true,
  };
}

/** Things worth saying before the upload, none of which block it. */
export function wallpaperWarnings(width: number, height: number): string[] {
  const warnings: string[] = [];
  if (width > height) {
    warnings.push(
      "Landscape photo: on a phone only the middle of it will show. A portrait crop usually looks better.",
    );
  }
  if (Math.min(width, height) < WALLPAPER_MIN_SHORT_EDGE) {
    warnings.push(
      `Small image (${width} × ${height}): it may look soft on a phone. ${WALLPAPER_RECOMMENDED.width} × ${WALLPAPER_RECOMMENDED.height} or larger is ideal.`,
    );
  }
  return warnings;
}

const HEIC_PATTERN = /\.(heic|heif)$/i;

/**
 * The reasons a chosen file cannot be used at all. Browsers cannot decode
 * HEIC, which is what iPhones shoot by default, so that case gets the
 * specific instructions rather than a generic "unsupported type".
 */
export function wallpaperInputError(file: {
  type: string;
  size: number;
  name?: string;
}): string | null {
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    (file.name && HEIC_PATTERN.test(file.name))
  ) {
    return "This is an HEIC photo, which browsers cannot read. On iPhone, share it as a JPG, or set Settings › Camera › Formats to Most Compatible and retake it.";
  }
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
    return "Use a JPG, PNG or WebP image.";
  }
  if (file.size > WALLPAPER_MAX_INPUT_BYTES) {
    return "That file is over 30 MB. Export a smaller JPG and try again.";
  }
  return null;
}

/** Whether the prepared result is small enough to store. */
export function wallpaperOutputError(bytes: number): string | null {
  return bytes > MAX_IMAGE_BYTES
    ? "Even after shrinking, this image is over 5 MB. Export it as a JPG and try again."
    : null;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
