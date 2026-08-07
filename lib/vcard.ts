/**
 * vCard 3.0 generation. 3.0 rather than 4.0 because iOS and Android Contacts
 * both import it without complaint, which is the only compatibility bar that
 * matters when someone is holding a phone at a conference.
 */

export type VCardInput = {
  displayName: string;
  username: string;
  jobTitle?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  profileUrl: string;
  avatarUrl?: string | null;
  socialUrls?: string[];
};

/** RFC 2426 §2.4.2 -- backslash, comma and semicolon are structural. */
function escapeValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Fold to 75 octets per RFC 2426 §2.6. Measured in UTF-8 bytes, not characters,
 * so an emoji in a job title cannot push a line over the limit or get split
 * down the middle of its encoding.
 */
function foldLine(line: string) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  // First line allows 75 octets, continuations 74 (one is spent on the leading
  // space that marks them as a continuation).
  let limit = 75;

  for (const character of line) {
    const size = encoder.encode(character).length;
    if (currentBytes + size > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
      limit = 74;
    }
    current += character;
    currentBytes += size;
  }
  if (current) parts.push(current);

  return parts.join("\r\n ");
}

function splitName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { given: "", family: "" };
  if (parts.length === 1) return { given: parts[0], family: "" };
  return {
    given: parts.slice(0, -1).join(" "),
    family: parts[parts.length - 1],
  };
}

export function buildVCard(input: VCardInput) {
  const displayName = input.displayName.trim() || `@${input.username}`;
  const { given, family } = splitName(displayName);

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeValue(family)};${escapeValue(given)};;;`,
    `FN:${escapeValue(displayName)}`,
  ];

  if (input.company?.trim()) lines.push(`ORG:${escapeValue(input.company.trim())}`);
  if (input.jobTitle?.trim()) lines.push(`TITLE:${escapeValue(input.jobTitle.trim())}`);
  if (input.email?.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeValue(input.email.trim())}`);
  }
  if (input.phone?.trim()) {
    lines.push(`TEL;TYPE=CELL,VOICE:${escapeValue(input.phone.trim())}`);
  }

  lines.push(`URL:${escapeValue(input.profileUrl)}`);
  for (const social of input.socialUrls ?? []) {
    if (social?.trim()) lines.push(`URL:${escapeValue(social.trim())}`);
  }

  if (input.avatarUrl?.trim()) {
    lines.push(`PHOTO;VALUE=URI:${escapeValue(input.avatarUrl.trim())}`);
  }
  if (input.bio?.trim()) lines.push(`NOTE:${escapeValue(input.bio.trim())}`);

  lines.push("END:VCARD");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Contacts apps show the filename on import, so keep it human-readable. */
export function vCardFilename(displayName: string, username: string) {
  const base =
    displayName
      .trim()
      .toLowerCase()
      // Decompose first so "García" becomes "garcia" rather than "garc-a".
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || username;
  return `${base}.vcf`;
}
