/**
 * Education and experience entries: the part of a profile a student actually
 * has to show, and the one thing links cannot express.
 *
 * Deliberately a display surface, not a resume builder. Resunova already does
 * analysis, tailoring, templates and ATS checking; duplicating that here would
 * be a worse version of a product that exists. This is the public page a
 * student shares, with a link out to the real resume.
 */

export type TimelineKind = "education" | "experience";

export type TimelineEntry = {
  id: number;
  kind: TimelineKind;
  /** "BSc Computer Science" or "Software Engineering Intern". */
  title: string;
  /** The university or the employer. */
  organisation: string;
  location: string;
  /** ISO yyyy-mm; the day is never shown, so it is never asked for. */
  started_on: string | null;
  ended_on: string | null;
  is_current: boolean;
  description: string;
};

export const TIMELINE_TITLE_MAX = 120;
export const TIMELINE_ORG_MAX = 120;
export const TIMELINE_DESCRIPTION_MAX = 300;

/** yyyy-mm, which is what <input type="month"> produces. */
const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Strict yyyy-mm, for validating what the editor produces. */
export function isMonth(value: string | null | undefined): boolean {
  return typeof value === "string" && MONTH.test(value);
}

/**
 * The yyyy-mm part of either format, or null.
 *
 * The editor works in months because a CV never prints a day, but the column
 * is a date and PostgREST returns yyyy-mm-dd. Reading only the strict form
 * silently blanked every date that came back from the database, which is
 * exactly what it did until a rendered page was actually looked at.
 */
export function toMonth(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const head = value.slice(0, 7);
  return MONTH.test(head) ? head : null;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatMonth(value: string | null): string {
  const month = toMonth(value);
  if (!month) return "";
  const [year, index] = month.split("-");
  return `${MONTH_NAMES[Number(index) - 1]} ${year}`;
}

/**
 * "Sep 2023 — Present", or just the start, or nothing at all. A student who
 * has only put a start date should not be shown a dangling dash.
 */
export function formatRange(entry: Pick<TimelineEntry, "started_on" | "ended_on" | "is_current">): string {
  const start = formatMonth(entry.started_on);
  const end = entry.is_current ? "Present" : formatMonth(entry.ended_on);
  if (start && end) return `${start} — ${end}`;
  return start || end || "";
}

/** Sortable key: newest first, entries without a date last. */
function sortKey(entry: TimelineEntry): number {
  // A current role outranks everything finished, whatever its start date.
  if (entry.is_current) return Number.MAX_SAFE_INTEGER;
  const stamp = toMonth(entry.ended_on) ?? toMonth(entry.started_on);
  if (!stamp) return -1;
  const [year, month] = stamp.split("-").map(Number);
  return year * 12 + month;
}

/** Most recent first, which is the order every CV uses. */
export function sortTimeline(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => sortKey(b) - sortKey(a));
}

export function timelineByKind(entries: TimelineEntry[]) {
  const sorted = sortTimeline(entries);
  return {
    experience: sorted.filter((entry) => entry.kind === "experience"),
    education: sorted.filter((entry) => entry.kind === "education"),
  };
}

/**
 * Whether an entry is worth saving. A title and an organisation are the
 * minimum that reads as a real line on a CV; everything else is optional, and
 * a half-filled row is dropped at save rather than published incomplete --
 * the same rule the starter links and shop items follow.
 */
export function isCompleteEntry(entry: Pick<TimelineEntry, "title" | "organisation">): boolean {
  return entry.title.trim().length > 0 && entry.organisation.trim().length > 0;
}

/**
 * The one ordering mistake worth catching while typing: an end before a
 * start. Everything else is the creator's business.
 */
export function rangeError(
  entry: Pick<TimelineEntry, "started_on" | "ended_on" | "is_current">,
): string | null {
  const start = toMonth(entry.started_on);
  const end = toMonth(entry.ended_on);
  if (entry.is_current || !start || !end) return null;
  return end < start ? "End date is before the start date." : null;
}

/** What a student sees pre-filled, in the spirit of the starter links. */
export const STUDENT_TIMELINE_EXAMPLES: Array<
  Pick<TimelineEntry, "kind" | "title" | "organisation" | "description">
> = [
  {
    kind: "education",
    title: "Your degree or course",
    organisation: "Your university or college",
    description: "Modules, grade, or anything you want people to know.",
  },
  {
    kind: "experience",
    title: "Internship or part-time role",
    organisation: "Where you worked",
    description: "One line on what you actually did.",
  },
];
