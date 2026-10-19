"use client";

import { useEffect, type RefObject } from "react";
import { parseRgb, relativeLuminance, requiredVeil } from "@/lib/avatar-scrim";

/**
 * Publishes `--avatar-veil` for a backdrop photo: how far the picture has to be
 * veiled before the text on it can be read. Solved rather than fixed, so a
 * photograph that can carry the text gets nothing over it.
 *
 * Shared by the public page and the dashboard preview because the dashboard
 * draws its own phone instead of mounting the real component. Anything the
 * preview calculates for itself drifts from the page it claims to show, which
 * is how the preview came to be painting a treatment the page no longer had.
 *
 * The measurement is done in the browser rather than stored, because the answer
 * depends on three things only the browser knows together: the photograph, the
 * theme's text colour, and the theme's card colour. It costs one 24px downsample
 * per avatar.
 */
export function useAvatarVeil({
  enabled,
  avatarUrl,
  targetRef,
  textRef,
  surfaceCss,
}: {
  enabled: boolean;
  avatarUrl?: string | null;
  /**
   * Element the veil is written to, and the element the card's surface colour
   * is read from. The property is inherited, so writing it on a container works
   * for anything painted inside it.
   */
  targetRef: RefObject<HTMLElement | null>;
  /** Element whose text colour the veil is solved against. Falls back to the target. */
  textRef?: RefObject<HTMLElement | null>;
  /**
   * CSS expression resolving to the colour the card would be without the photo.
   * The fallback chain differs between the real page and the preview, which
   * names its own colours, so it is passed in rather than assumed.
   */
  surfaceCss?: string;
}): void {
  useEffect(() => {
    if (!enabled) return;
    const target = targetRef.current;
    if (!target || !avatarUrl) return;

    // A canvas can only be read back if the image server allows it. If it does
    // not, the photograph cannot be measured and nothing is published, which
    // leaves the CSS fallback in place rather than painting from a guess.
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      if (cancelled) return;
      const photo = sampleLuminance(image);
      if (photo === null) return;
      const text = parseRgb(
        getComputedStyle(textRef?.current ?? target).color,
      );
      const surface = parseRgb(resolveSurface(target, surfaceCss));
      if (!text || !surface) return;
      const veil = requiredVeil(
        photo,
        relativeLuminance(text.r, text.g, text.b),
        relativeLuminance(surface.r, surface.g, surface.b),
      );
      target.style.setProperty("--avatar-veil", veil.toFixed(3));
    };
    image.onerror = () => {};
    image.src = avatarUrl;

    return () => {
      cancelled = true;
    };
  }, [enabled, avatarUrl, targetRef, textRef, surfaceCss]);
}

const DEFAULT_SURFACE_CSS = "var(--profile-surface, var(--paper, #faf9f1))";

/**
 * Mean relative luminance of a photograph, or null when it cannot be read.
 *
 * Downsampled to a handful of pixels: this is asking how bright the picture is
 * overall, and a thousand samples would cost a great deal more to answer the
 * same question. Transparent pixels are left out rather than counted as black,
 * so a circular logo on a transparent background measures as the picture it is
 * and not as a dark disc.
 */
function sampleLuminance(image: HTMLImageElement): number | null {
  try {
    const canvas = document.createElement("canvas");
    const size = 24;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, size, size);
    const { data } = context.getImageData(0, 0, size, size);
    let total = 0;
    let counted = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha < 0.5) continue;
      // Un-premultiply, so a semi-transparent pixel reads as its own colour.
      total +=
        relativeLuminance(
          data[i] / alpha,
          data[i + 1] / alpha,
          data[i + 2] / alpha,
        ) * alpha;
      counted += alpha;
    }
    if (counted === 0) return null;
    return total / counted;
  } catch {
    // A tainted canvas throws on read: the browser refusing to let a page sample
    // an image it did not host. Not worth surfacing -- it just means this
    // picture cannot be measured.
    return null;
  }
}

/**
 * The colour the card would be without the backdrop, as a computed rgb string.
 *
 * Read through a probe rather than guessed at, because the answer differs per
 * template and per whether the creator has a custom palette: the browser already
 * knows which page this is.
 */
function resolveSurface(target: HTMLElement, surfaceCss?: string): string {
  const probe = document.createElement("span");
  probe.style.color = surfaceCss ?? DEFAULT_SURFACE_CSS;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  target.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}
