import { BRAND_URL } from "@/lib/brand";

export const REFERRER_STORAGE_KEY = "cueful:referrer";
const REFERRER_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function validReferralUsername(value: string | null | undefined) {
  const username = value?.trim().toLowerCase() ?? "";
  return /^[a-z0-9][a-z0-9_-]{2,29}$/.test(username) ? username : null;
}

export function captureReferralFromLocation() {
  const username = validReferralUsername(
    new URLSearchParams(window.location.search).get("ref"),
  );
  if (!username) return;

  window.localStorage.setItem(
    REFERRER_STORAGE_KEY,
    JSON.stringify({
      username,
      expiresAt: Date.now() + REFERRER_TTL_MS,
    }),
  );
}

export function readReferralAttribution() {
  try {
    const saved = window.localStorage.getItem(REFERRER_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as {
      username?: string;
      expiresAt?: number;
    };
    if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) {
      clearReferralAttribution();
      return null;
    }
    return validReferralUsername(parsed.username);
  } catch {
    clearReferralAttribution();
    return null;
  }
}

export function clearReferralAttribution() {
  window.localStorage.removeItem(REFERRER_STORAGE_KEY);
}

export function creatorInviteUrl(username: string) {
  return `${BRAND_URL}/?ref=${encodeURIComponent(username)}&utm_source=creator_invite&utm_medium=share`;
}

export function creatorBadgeUrl(username: string) {
  return `${BRAND_URL}/?ref=${encodeURIComponent(username)}&utm_source=creator_badge&utm_medium=profile`;
}
