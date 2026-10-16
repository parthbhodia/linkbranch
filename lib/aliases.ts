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
