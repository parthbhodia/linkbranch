/**
 * Extra names that resolve to a profile ("aliases").
 *
 * The rules live in the database -- `public.add_profile_alias` owns the
 * namespace checks, because a name must never be both a handle and an alias for
 * different profiles. What is here is the shape check the field can run as you
 * type, so the common mistake is answered without a round trip.
 */
export const ALIAS_LIMIT = 5;

const ALIAS_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;

/** Same normalisation the database applies: lowercase, trimmed, no spaces. */
export function normaliseAlias(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function aliasFormatError(value: string): string | null {
  const alias = normaliseAlias(value);

  if (!alias) return "Enter a name.";
  if (alias.length < 3) return "Use at least 3 characters.";
  if (alias.length > 30) return "Use at most 30 characters.";
  if (!ALIAS_PATTERN.test(alias)) {
    return "Use letters, numbers, dashes and underscores, starting with a letter or number.";
  }

  return null;
}

/**
 * PostgREST answers "no such function" until the alias migration has been run
 * by hand. That is a setup state, not something the person typing a name did,
 * so it should not read as their mistake.
 */
export function aliasErrorMessage(message: string) {
  return /could not find the function|does not exist|schema cache/i.test(message)
    ? "Extra names aren't switched on yet — the database update still needs to be run."
    : message;
}

/** Lowercase letters and digits only, which is what the field accepts. */
function aliasFrom(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Names worth offering when the field is empty.
 *
 * A handle is usually a slug of the brand -- "mk-tv" against "MKTV" -- and the
 * name visitors type is the brand itself, so the display name is offered
 * before the handle. Accents fold, so "José" suggests "jose" and not "jos".
 *
 * Names the profile already answers to are skipped rather than suggested, and
 * anything the format check would reject is dropped, so every entry returned is
 * something the database will accept.
 */
export function aliasSuggestions({
  displayName,
  username,
  taken = [],
}: {
  displayName: string;
  username: string;
  taken?: Iterable<string>;
}): string[] {
  const owned = new Set(
    [...taken, username].map((value) => normaliseAlias(value)),
  );
  const candidates = [
    aliasFrom(displayName),
    aliasFrom(displayName.split(/\s+/)[0] ?? ""),
    aliasFrom(username),
    aliasFrom(username.split(/[-_\s]/)[0] ?? ""),
  ];

  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    if (owned.has(candidate)) continue;
    if (aliasFormatError(candidate)) continue;
    suggestions.push(candidate);
  }

  return suggestions;
}
