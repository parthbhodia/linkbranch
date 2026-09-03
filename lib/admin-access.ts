/**
 * Who may open /admin.
 *
 * The allowlist lives in ADMIN_EMAILS rather than in this file because the
 * repository is public -- a hardcoded address would publish a personal email
 * to anyone who reads the source, and changing who has access would mean a
 * deploy. Set it in the Vercel project as a comma-separated list.
 *
 * Fails closed: an unset or empty variable admits nobody, so a missing
 * environment variable cannot silently open the page up.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return false;

  return allowed.includes(email.trim().toLowerCase());
}
