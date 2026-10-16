/**
 * Links can carry a free-form section heading. Sections are never stored as
 * their own rows -- a group is just the run of links that share a heading -- so
 * the grouping is always derived from the ordered list.
 *
 * The same helper runs in the editor (to keep the flat list contiguous, so the
 * one drag-sortable list matches what is drawn) and on the public page (to draw
 * a heading per group), so what the creator arranges is what visitors see.
 *
 * The heading accessor differs by caller: the editor reads `group_name`, the
 * public page reads `group`, so grouping takes a getter rather than a field.
 */
export type LinkGroup<T> = { name: string; links: T[] };

/**
 * Collect links into groups in order of first appearance. An empty (or
 * whitespace-only) heading is the unsectioned group; it keeps the existing flat
 * "My links" list. Non-contiguous links that share a heading collapse into one
 * group, which is how a stray link snaps back under its section.
 */
export function groupLinksBySection<T>(
  links: T[],
  getGroup: (link: T) => string,
): LinkGroup<T>[] {
  const groups: LinkGroup<T>[] = [];
  const byName = new Map<string, LinkGroup<T>>();

  for (const link of links) {
    const name = (getGroup(link) ?? "").trim();
    let group = byName.get(name);
    if (!group) {
      group = { name, links: [] };
      byName.set(name, group);
      groups.push(group);
    }
    group.links.push(link);
  }

  return groups;
}

/** Flatten groups back to a list with each section's links contiguous. */
export function sortLinksBySection<T>(
  links: T[],
  getGroup: (link: T) => string,
): T[] {
  return groupLinksBySection(links, getGroup).flatMap((group) => group.links);
}
