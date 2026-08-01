/**
 * Accepts what people actually type -- "example.com", " example.com " -- and
 * returns a usable absolute URL, "" for blank, or null when it cannot be made
 * into one. Shared by the setup wizard and the dashboard's link editor, which
 * both validate the same fields.
 */
export function normalizeHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      !parsed.hostname
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
