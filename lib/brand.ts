export const BRAND_NAME = "Cueful";
export const BRAND_DOMAIN = "cueful.bio";
export const BRAND_URL = `https://${BRAND_DOMAIN}`;
export const DEFAULT_SOCIAL_IMAGE = `${BRAND_URL}/opengraph-image`;
/** Display prefix for public pages — root-mapped, no `/u/`. */
export const PUBLIC_PROFILE_PREFIX = `${BRAND_DOMAIN}/`;

export function publicProfileAddress(username = "username") {
  return `${PUBLIC_PROFILE_PREFIX}${username}`;
}

/** App-relative path for a public profile (`/name`). */
export function publicProfilePath(username = "username") {
  return `/${username.trim().toLowerCase()}`;
}

/** Absolute public profile URL. */
export function publicProfileUrl(username = "username") {
  return `${BRAND_URL}${publicProfilePath(username)}`;
}
