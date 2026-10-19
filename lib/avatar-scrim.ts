/**
 * How hard a photograph has to be veiled before text can sit on it.
 *
 * The backdrop used to wear one fixed scrim, chosen to be dark enough for the
 * worst photograph anyone might upload. That is wrong in both directions at
 * once: a light photograph under a scrim built for a dark one looks like a
 * mistake, and the scrim is what stops the picture reading as a picture at all.
 *
 * So the veil is solved for instead of guessed at. Given how bright the photo
 * is, how bright the text is, and how bright the card would be without the
 * photo, this returns the least veil that reaches a readable contrast -- and
 * zero, when the photo is already good enough to carry the text unaided.
 */

/**
 * WCAG relative luminance of an sRGB colour, 0..1.
 *
 * Linear-light, which is also the space alpha compositing is linear in. That is
 * what lets the veil be solved for rather than iterated: mixing the photo into
 * the surface by `a` lands at a known luminance for any `a`, so the first one
 * that reaches the target can be found directly.
 */
export function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (value: number) => {
    const s = clamp(value) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function clamp(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(255, Math.max(0, value));
}

/**
 * Contrast ratio between two relative luminances.
 *
 * The two are pre-sorted rather than swapped on the values themselves, so a
 * caller cannot get a ratio below 1 by passing them the wrong way round.
 */
export function contrastRatio(a: number, b: number): number {
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Least veil, 0..1, lifting `photo` toward `surface` until `text` reads on it. */
export function requiredVeil(
  photo: number,
  text: number,
  surface: number,
  minContrast = 4.5,
): number {
  // The photograph already carries the text. Leave it alone.
  if (contrastRatio(photo, text) >= minContrast) return 0;

  // The surface alone cannot carry this text either, so no amount of veiling
  // helps. Go fully opaque and let it be an ordinary card, which is the same
  // thing the theme was before the backdrop was switched on.
  if (contrastRatio(surface, text) < minContrast) return 1;

  // Bisection rather than arithmetic: the mix is linear in luminance but the
  // contrast ratio is a ratio of two sums, so the answer is not the kind of
  // thing worth solving in closed form. Twenty steps is far past the precision
  // a percentage of opacity can express.
  let lo = 0;
  let hi = 1;
  for (let step = 0; step < 20; step += 1) {
    const mid = (lo + hi) / 2;
    const mixed = photo * (1 - mid) + surface * mid;
    if (contrastRatio(mixed, text) >= minContrast) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * Reads an sRGB triple out of whatever a stylesheet or a canvas hands back:
 * "#rgb", "#rrggbb", "rgb(1, 2, 3)" or a bare "1, 2, 3".
 *
 * Returns null rather than guessing, so a caller can fall back deliberately
 * instead of painting the page from a colour it failed to understand.
 */
export function parseRgb(input: string): { r: number; g: number; b: number } | null {
  const text = input.trim();
  if (!text) return null;

  const hex = text.startsWith("#") ? text.slice(1) : null;
  if (hex) {
    if (hex.length === 3) {
      const [r, g, b] = hex.split("");
      if ([r, g, b].some((c) => !/[0-9a-f]/i.test(c))) return null;
      return {
        r: parseInt(r + r, 16),
        g: parseInt(g + g, 16),
        b: parseInt(b + b, 16),
      };
    }
    if (hex.length === 6 && /^[0-9a-f]{6}$/i.test(hex)) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
    return null;
  }

  const parts = text.match(/-?\d+(\.\d+)?/g);
  if (!parts || parts.length < 3) return null;
  return {
    r: Number(parts[0]),
    g: Number(parts[1]),
    b: Number(parts[2]),
  };
}
