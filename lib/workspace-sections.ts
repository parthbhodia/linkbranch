/**
 * The dashboard's sections, and the parser that lets one survive a reload.
 *
 * The list is the source and the type is derived from it, so a section can
 * never exist in one and not the other.
 *
 * Why this is shared rather than living in the dashboard: the active section
 * is read back on the SERVER (see app/dashboard/page.tsx) so the first render
 * already has it. The dashboard is a client module; the server only needs the
 * names and the parser, not the icons.
 */
export const workspaceSectionIds = [
  "profile",
  "connections",
  "content",
  "commerce",
  "appearance",
  "analytics",
  "account",
  "more",
  "highlights",
  "health",
] as const;

export type WorkspaceSection = (typeof workspaceSectionIds)[number];

export const DEFAULT_WORKSPACE_SECTION: WorkspaceSection = "profile";

/**
 * A section name off the query string, or null. Anything unrecognised is null
 * rather than a guess -- the value arrives from the URL, so a stale or
 * hand-edited `?tab=` must land on the default instead of a blank workspace.
 */
export function parseWorkspaceSection(value: unknown): WorkspaceSection | null {
  // ⚠️ Held by the COMPILER, not by a test: `includes` needs a string, so
  // removing this is a tsc error (TS2345). At runtime it is redundant --
  // `includes` already answers false for an array or a number -- so a test
  // asserting "a non-string gives null" passes either way. Verified by
  // mutation: deleting this line turns nothing red.
  if (typeof value !== "string") return null;
  return (workspaceSectionIds as readonly string[]).includes(value)
    ? (value as WorkspaceSection)
    : null;
}
