/**
 * Where a visit came from, when the visitor tapped nothing we could see.
 *
 * A QR scan arrives with no referrer: the camera app opens the browser
 * directly, so `document.referrer` is empty and the visit is recorded exactly
 * like someone typing the address. That makes the most valuable thing a
 * creator does with this product -- holding a phone out at a market stall, a
 * counter, a conference -- the one thing the analytics cannot see.
 *
 * So every code and printed asset we generate carries `?s=<source>`. The
 * public page reads it, records it, and removes it from the address bar so
 * the tag never travels any further than the scan it describes.
 */

export const SHARE_SOURCES = [
  "qr",
  "card",
  "wallet",
  "poster",
  "square",
  "tent",
  "sticker",
  "signature",
] as const;

export type ShareSource = (typeof SHARE_SOURCES)[number];

/** The query key. Short because it is encoded into every QR code. */
export const SHARE_SOURCE_KEY = "s";

/** Everything scanned from a code, as opposed to a link someone clicked. */
export const SCAN_SOURCES: ShareSource[] = [
  "qr",
  "card",
  "wallet",
  "poster",
  "tent",
  "sticker",
];

export const SHARE_SOURCE_LABELS: Record<ShareSource, string> = {
  qr: "QR code",
  card: "Card screen",
  wallet: "Wallet pass",
  poster: "Poster",
  square: "Social post",
  tent: "Table tent",
  sticker: "Sticker",
  signature: "Email signature",
};

export function isShareSource(value: unknown): value is ShareSource {
  return (
    typeof value === "string" &&
    SHARE_SOURCES.includes(value as ShareSource)
  );
}

/** The stored value for an arbitrary query parameter, or null. */
export function parseShareSource(value: unknown): ShareSource | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim().toLowerCase();
  return isShareSource(candidate) ? candidate : null;
}

/**
 * The same URL with the source tag on it. Replaces an existing tag rather
 * than appending a second one, so re-tagging an already-tagged URL is safe.
 */
export function withShareSource(url: string, source: ShareSource): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(SHARE_SOURCE_KEY, source);
    return parsed.toString();
  } catch {
    return url;
  }
}

/** The URL without the tag, for display and for sharing onward. */
export function withoutShareSource(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete(SHARE_SOURCE_KEY);
    // An empty search leaves a bare "?" behind, which looks like a mistake.
    parsed.search = parsed.searchParams.toString();
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isScanSource(source: ShareSource | null): boolean {
  return source !== null && SCAN_SOURCES.includes(source);
}
