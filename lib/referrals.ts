import { BRAND_URL } from "@/lib/brand";

export const REFERRER_COOKIE = "cueful_referrer";

export function validReferralUsername(value: string | null | undefined) {
  const username = value?.trim().toLowerCase() ?? "";
  return /^[a-z0-9][a-z0-9_-]{2,29}$/.test(username) ? username : null;
}

export function captureReferralFromLocation() {
  const username = validReferralUsername(
    new URLSearchParams(window.location.search).get("ref"),
  );
  if (!username) return;

  document.cookie = `${REFERRER_COOKIE}=${encodeURIComponent(username)}; Max-Age=604800; Path=/; SameSite=Lax; Secure`;
}

export function readReferralCookie() {
  const prefix = `${REFERRER_COOKIE}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);

  return validReferralUsername(value ? decodeURIComponent(value) : null);
}

export function clearReferralCookie() {
  document.cookie = `${REFERRER_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
}

export function creatorInviteUrl(username: string) {
  return `${BRAND_URL}/?ref=${encodeURIComponent(username)}&utm_source=creator_invite&utm_medium=share`;
}

export function creatorBadgeUrl(username: string) {
  return `${BRAND_URL}/?ref=${encodeURIComponent(username)}&utm_source=creator_badge&utm_medium=profile`;
}
