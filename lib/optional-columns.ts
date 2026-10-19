import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Postgres `undefined_column`.
 *
 * PostgREST answers this when a select names a column the database does not
 * have -- which is what a migration that has not been run yet looks like from
 * the application's side.
 */
export const UNDEFINED_COLUMN = "42703";

export function isUndefinedColumn(
  error: PostgrestError | null | undefined,
): boolean {
  return Boolean(error && error.code === UNDEFINED_COLUMN);
}

/**
 * The same select string without one column.
 *
 * Splits on commas rather than doing a replace, so a column whose name happens
 * to appear inside another one -- `id` inside `profile_id` -- is not taken out
 * by accident, and whitespace around entries is normalised on the way through.
 */
export function withoutColumn(columns: string, column: string): string {
  return columns
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry !== column)
    .join(",");
}

type SelectResult = {
  data: unknown;
  error: PostgrestError | null;
};

/**
 * Selects `columns`, and if the database is not yet carrying `optional`, selects
 * without it instead of returning nothing.
 *
 * PostgREST rejects a query **in full** when any column in it is unknown: it
 * does not hand back the columns it does know about. So a single column added
 * ahead of its migration does not degrade a page, it empties it -- a published
 * profile lost every one of its links, and the only visible symptom was a card
 * with nothing in it, because a rejected query and a creator with no links look
 * identical to the renderer.
 *
 * Migrations here are applied by hand, which means code can always reach
 * production before the schema does. That is not a fault to design around so
 * much as an ordering that exists, and the cost of tolerating it is a second
 * query only in the case that is already broken.
 *
 * Errors that are not a missing column are logged and treated as no rows, which
 * is what the callers did before this existed -- but logged rather than
 * swallowed, because a page that is empty for a reason nobody can see is how
 * this went unnoticed in the first place.
 */
export async function selectToleratingColumn<T>(
  columns: string,
  optional: string,
  run: (columns: string) => PromiseLike<SelectResult>,
): Promise<T[]> {
  const first = await run(columns);
  if (!first.error) return (first.data ?? []) as T[];

  if (!isUndefinedColumn(first.error)) {
    console.error(`select failed: ${first.error.message}`);
    return [];
  }

  console.warn(
    `column "${optional}" is missing from the database; selecting without it. ` +
      "Run the migration that adds it for the affected feature to work.",
  );

  const second = await run(withoutColumn(columns, optional));
  if (second.error) {
    console.error(`select failed: ${second.error.message}`);
    return [];
  }
  return (second.data ?? []) as T[];
}
