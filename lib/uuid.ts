/**
 * Whether a string is a UUID, for request bodies that carry a profile id.
 *
 * Two analytics routes validate the same shape before touching the database,
 * and the regex is long enough that a second copy of it is a second chance to
 * get a character class wrong.
 *
 * Deliberately strict about version and variant: anything not produced by a
 * real UUID generator is a caller sending junk, and a malformed id should be a
 * 400 rather than a row the database refuses on a foreign key.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value.toLowerCase());
}
