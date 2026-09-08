# Cueful calibration

Answers to the calibration protocol in `PLAYBOOK.md`, derived from the code on
2026-09-06. **Every claim here cites a file.** If this file and the code
disagree, the code is right and this is stale: re-run the protocol.

The repository is named `linkbranch`; the product is **Cueful**
(`cueful.bio`). Use the product name in all copy.

---

## 1. What the reader wants

A creator, freelancer, or referral-driven seller who needs one link that holds
everything (`app/templates/page.tsx`), and who wants to know what their
audience actually did with it. Not a tool to admire, a link that works and
tells them something back.

## 2. What the product computes that the reader cannot see

This is the raw material for every hook. From `README.md`:

- link opens
- referral opens
- **coupon copies**

**The strongest gap available to this product is the third one.** A creator has
no way to know which of their referral codes people actually copy, and Cueful
measures it. `app/layout.tsx` already states the claim in the OG description:
"the only one that shows you which codes people actually copy." That sentence
is the best line in the repository and it is currently only in a meta tag.

## 3. The offer, exactly

**Cueful is entirely free with no paid tier.** `app/terms/page.tsx:115`:
"Cueful is offered free and as-is." It is also **ad-free**, stated repeatedly
in `app/page.tsx`.

Consequences for the playbook:

- **12 (anchoring), 17 (scarcity/urgency), 18 (decoy) have no honest surface
  here.** There is no price to anchor, no cap to run out of, no tier to
  decoy. Do not manufacture one.
- **20 (reciprocity) is the whole model.** The product is the gift.
- The information-gap close is as cheap as it can possibly be, which makes the
  gap technique unusually strong for this product. Nothing sits between the
  question and the answer.

## 4. What persists before signup

- **Import draft: `sessionStorage`** (`components/import-starter.tsx:44`,
  cleared in `components/onboarding-wizard.tsx:921`). Session-scoped, so it
  does **not** survive a tab close.
- Referral attribution in `localStorage` (`lib/referrals.ts`). Internal
  attribution, not user content, so not a possession claim.
- Username is picked on the landing page before the account exists
  (`UsernameClaim` in `components/marketing-home.tsx`).

**Honesty consequence:** possession framing (principle 06) is available for the
import draft and the claimed username, but **never say "saved on this device"**
for the import draft. It is session memory. "Your import is still here" is
true; "saved" is not.

**The claim flow is endowment built into acquisition.** `drafts/README.md`: a
pre-filled page at `cueful.bio/claim/<token>` "already filled in with their
links, they sign up and the page becomes theirs." The artefact exists before
the relationship does. This is the textbook use of principle 06 and it is
already shipped.

## 5. Design tokens and what they mean

`components/theme-provider.tsx`, MUI with `cssVariables: true`:

| role | value |
|---|---|
| primary | `#496800` (olive) |
| secondary | `#586249` |
| background | `#faf9f1` / `#f4f3eb` (warm cream) |
| text | `#1b1c18` / `#5e6256` |
| divider | `#c5c8b9` |
| shape | `borderRadius: 18`, buttons `10` |
| type | Manrope, h1 `clamp(3rem, 5.5vw, 4.75rem)`, weight 800 |

**No status palette is overridden**, so error/warning/success/info come from
MUI defaults. Unlike a project that spends amber on status, no brand hue is
reserved here, but check MUI's defaults before using red, amber or green as
emphasis.

**Principle 01 (gold gradient) has no surface on this product.** The palette is
olive and cream with no warm-metallic cue anywhere. Do not import a gold accent
to satisfy the principle; the premium signal here would have to be built from
restraint and typography instead.

## 6. Search terms already owned

Route group `app/(seo)/`, one page each. **Do not write a new page or a title
tag that competes with these.**

- Category: `best-link-in-bio-tools`, `link-in-bio-tools`, `free-link-in-bio`,
  `free-linktree-alternative`
- Comparison: `cueful-vs-linktree`, `cueful-vs-beacons`, `cueful-vs-carrd`
- Platform: `link-in-bio-for-instagram`, `link-in-bio-for-tiktok`
- Definition: `what-does-link-in-bio-mean`
- Other: `digital-business-card`, `templates`, `discover`
- Locales: `es`, `it`

Root metadata (`app/layout.tsx`) holds the head term: "Cueful, free link in bio
for creators", with a keywords array naming link in bio, creator profile,
referral link analytics, creator analytics, coupon code tracking.

Note the asymmetry: the SEO set is heavy on **link-in-bio** terms and light on
the **referral and coupon analytics** terms, which is where the actual
differentiator lives.

## 7. House copy style

**Cueful uses em dashes** (`app/layout.tsx`: "referral codes — and the only one
that shows you which codes people actually copy"). Do **not** import a
no-em-dash rule from another project. Style is project-level.

No banned-word list exists yet. If one is wanted, write it here.

## 8. Competitors and what they structurally cannot do

Named in the comparison routes: **Linktree, Beacons, Carrd.**

The defensible position is the pair of facts in §3 and §2: free with no paid
tier, ad-free, and coupon-copy measurement. A competitor running a freemium
upsell cannot match "free and ad-free" without changing its business, which is
the same shape as any structural moat. Verify current competitor pricing before
publishing any claim about it, and date the claim.

---

## Standing findings

**The hero closes the loop and buries the differentiator.**
`components/marketing-home.tsx:370` reads "One free link for everything you
create", with a body about building an ad-free page for Instagram, TikTok and
YouTube. That is a category description, and every competitor could run it
unchanged. Meanwhile the sharpest sentence the product owns sits in a meta tag.

The gap-shaped alternative, using §2:

> You do not know which of your codes people actually copy. Cueful does.

Draft, not shipped. Test it against the current hero as a single variable
before believing it.

**The differentiator is under-indexed in SEO.** Fourteen SEO pages, none aimed
at referral or coupon analytics, which is the one thing no competitor page can
answer. See §6.
