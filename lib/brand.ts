export const BRAND_NAME = "Cueful";
export const BRAND_DOMAIN = "cueful.bio";
export const BRAND_URL = `https://${BRAND_DOMAIN}`;
export const DEFAULT_SOCIAL_IMAGE = `${BRAND_URL}/opengraph-image`;
export const PUBLIC_PROFILE_PREFIX = `${BRAND_DOMAIN}/u/`;

export function publicProfileAddress(username = "username") {
  return `${PUBLIC_PROFILE_PREFIX}${username}`;
}
