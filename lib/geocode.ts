/**
 * Address search for the map picker, via OpenStreetMap's Nominatim.
 *
 * Nominatim is free and keyless, with a usage policy in return: identify the
 * application, no more than one request a second, and no autocomplete-style
 * hammering. The picker therefore searches on an explicit click, and the
 * request goes through our own route (app/api/geocode) so it carries a proper
 * User-Agent and identical queries are cached server-side.
 */

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
};

export const GEOCODE_QUERY_MIN_LENGTH = 3;
export const GEOCODE_QUERY_MAX_LENGTH = 200;
export const GEOCODE_RESULT_LIMIT = 5;

/**
 * The results we keep from a Nominatim jsonv2 payload. Anything without a
 * name or with unparseable coordinates is dropped rather than rendered as a
 * broken option.
 */
export function parseNominatimResults(payload: unknown): GeocodeResult[] {
  if (!Array.isArray(payload)) return [];
  const results: GeocodeResult[] = [];
  for (const entry of payload) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const label = typeof row.display_name === "string" ? row.display_name.trim() : "";
    const lat = Number(row.lat);
    const lng = Number(row.lon);
    if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    results.push({ label, lat, lng });
    if (results.length === GEOCODE_RESULT_LIMIT) break;
  }
  return results;
}

/** Whether a query is worth sending upstream at all. */
export function isSearchableQuery(query: string): boolean {
  const length = query.trim().length;
  return length >= GEOCODE_QUERY_MIN_LENGTH && length <= GEOCODE_QUERY_MAX_LENGTH;
}
