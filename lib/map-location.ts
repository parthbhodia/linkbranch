/**
 * A pin on the map for the public page's "Find us" block.
 *
 * Stored as two nullable columns on profiles rather than PostGIS: there is one
 * point per profile, it is only ever read back whole, and nothing queries by
 * distance. The short `location` text ("Pune, India") stays the eyebrow under
 * the name; `map_address` is the fuller street address shown beside the map.
 */

export type MapPin = { lat: number; lng: number };

export type PublicMapLocation = MapPin & {
  /** Street address shown beside the map. May be empty. */
  address: string;
  /** What the pin is: the creator's display name. */
  label: string;
};

export const MAP_ADDRESS_MAX_LENGTH = 200;

/** Default zoom for a single business pin: streets readable, area recognisable. */
export const PIN_ZOOM = 16;

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
}

/**
 * Accepts numbers or the numeric strings PostgREST returns for double
 * precision columns. Anything out of range or unparseable is no pin at all,
 * never a pin at 0,0 in the Gulf of Guinea.
 */
export function parsePin(lat: unknown, lng: unknown): MapPin | null {
  const la = toNumber(lat);
  const ln = toNumber(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}

/** Six decimals is ~11cm; anything finer is noise from a dragged marker. */
export function roundPin(pin: MapPin): MapPin {
  return {
    lat: Math.round(pin.lat * 1e6) / 1e6,
    lng: Math.round(pin.lng * 1e6) / 1e6,
  };
}

export function formatPin(pin: MapPin): string {
  return `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`;
}

/**
 * Google's universal directions URL. It opens the Maps app where one is
 * installed and the website everywhere else, on every platform, without an
 * API key -- which Apple's and OpenStreetMap's equivalents cannot all claim.
 */
export function directionsUrl(pin: MapPin): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`;
}

const DECIMAL = String.raw`(-?\d{1,3}(?:\.\d+)?)`;

// Shop owners rarely know their coordinates but very often have a Google
// Maps link to their listing. Each of these is a form that link takes, or
// a bare "lat, lng" pair copied from one.
// Order matters: a place URL carries both the place itself (!3d…!4d…) and
// the viewport centre (@lat,lng), and only the first is where the shop is.
const COORDINATE_PATTERNS: RegExp[] = [
  new RegExp(String.raw`!3d${DECIMAL}!4d${DECIMAL}`),
  new RegExp(String.raw`[?&](?:q|query|ll|destination)=${DECIMAL},${DECIMAL}`),
  new RegExp(String.raw`[@/]${DECIMAL},${DECIMAL}(?:[,/z]|$)`),
  new RegExp(String.raw`^\s*${DECIMAL}\s*,\s*${DECIMAL}\s*$`),
];

/**
 * A pin from text the creator typed or pasted, when that text is coordinates
 * or a Google Maps link carrying them. Returns null for an address, which
 * needs geocoding instead.
 */
export function parseCoordinateQuery(query: string): MapPin | null {
  let text = query.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // Leave undecodable input as typed.
  }
  for (const pattern of COORDINATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const pin = parsePin(match[1], match[2]);
      if (pin) return pin;
    }
  }
  return null;
}

/**
 * What the public page shows, or null when there is nothing to show. Hidden
 * pins stay stored so switching the map back on does not mean placing it
 * again.
 */
export function publicMapLocation(profile: {
  map_lat: unknown;
  map_lng: unknown;
  map_address?: string | null;
  show_map?: boolean | null;
  display_name?: string | null;
  username?: string | null;
}): PublicMapLocation | null {
  if (profile.show_map === false) return null;
  const pin = parsePin(profile.map_lat, profile.map_lng);
  if (!pin) return null;
  return {
    ...pin,
    address: (profile.map_address ?? "").trim(),
    label: profile.display_name?.trim() || `@${profile.username ?? ""}`,
  };
}
