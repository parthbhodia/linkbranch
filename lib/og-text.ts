// Text rules for the social preview card at app/u/[username]/opengraph-image.
//
// next/og draws the card with a single Latin font, and Satori fails the whole
// render -- a 500, not a fallback -- when handed a script that font cannot
// shape. A bio in Arabic ("lookupType: 5 - substFormat: 3 is not yet
// supported") took the card down, so every unfurl of that profile lost its
// image.
//
// Keeping this out of the route file lets the stripping rules be tested
// directly; the profile page itself is never filtered.
const UNDRAWABLE =
  /[^\p{Script=Latin}0-9\u0020-\u007E\u2013\u2014\u2018\u2019\u201C\u201D\u2026\u00B7]/gu;

const MEANINGFUL = /[\p{Script=Latin}0-9]/u;

export function drawableCardText(value: string | null | undefined) {
  const cleaned = (value ?? "")
    .replace(UNDRAWABLE, "")
    .replace(/\s+/g, " ")
    .trim();

  // Punctuation left behind by a script we stripped ("...رحب" -> ".") would
  // otherwise render as a lone full stop floating in the card.
  return MEANINGFUL.test(cleaned) ? cleaned : "";
}
