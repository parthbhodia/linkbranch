# Marketing psychology playbook (portable core)

Applied notes from "Marketing Psychology, Decoded" (a @samriddhisdiary guide,
21 concepts), rewritten as a working method.

**This file is project-neutral on purpose.** It carries the principles, the
method, and the guardrails. Everything about *this* product lives in
`CALIBRATION.md` next to it. That split is what makes the file portable: copy
this one verbatim into any project, then run the calibration below to produce
that project's own mappings.

---

## Before anything else: the calibration protocol

**A principle applied to a product you have not read is a guess.** The single
most common failure is describing what a product already does, calling the
principle satisfied, and being wrong. Run this first, write the answers into
`CALIBRATION.md`, and re-run it whenever the product changes materially.

1. **What does the reader actually want?** Not what we admire about ourselves.
   The job to be done, in their words.
2. **What does the product compute that the reader does not know?** This list
   is the raw material for every hook. Each item is a headline, an email, and
   an ad.
3. **What is the offer, exactly?** Free tier limits, what an anonymous visitor
   gets, what requires an account, what recurs. Get the numbers from constants
   in code, never from an existing marketing page.
4. **What persists before signup?** Decides whether possession framing is
   honest on any given surface.
5. **What are the design tokens and what do they mean?** Especially: which
   colours are *status* and therefore unavailable as brand emphasis.
6. **Which search terms does the project already own,** and on which route? Two
   pages bidding on one phrase split the result.
7. **What is the house copy style?** Punctuation rules, banned words, spelling
   conventions. These are project-level and differ; do not import them.
8. **Who are the named competitors** and what do they structurally *cannot* do?

Answer with file paths and constants. If you cannot cite it, you have not
verified it.

---

## The honesty line

Every principle here works by making a true thing land harder. None is a
licence to make an untrue thing land at all. Never ship:

- Countdown timers, deadlines, or "N left" where no real deadline or cap exists
- Anchors against a price never charged
- Possession claims for something the reader does not hold
- Numbers that are not verified and dated
- A gap the free tier cannot close

Beyond ethics, these are growth rules: a hook that does not pay off spends the
next campaign's clickthrough, and a false claim on a product's own page costs
the credibility the product is selling.

---

## The lead technique: information gap

Open with the gap, not the answer, on every surface. This is the default, not
one of twenty-one.

**The formula.** Three parts. Drop one and it stops working.

1. **A specific, finite unknown.** Countable and closed beats vague. Vague does
   not itch.
2. **Stakes the reader already accepts.** If you have to explain why it
   matters, the line is too long.
3. **A close they can reach now.** The cheaper the close, the harder the hook
   pulls, which makes a generous free tier a copywriting asset rather than only
   a pricing decision.

**The one-line test.** After reading it, can the reader state the exact
question they now want answered? If they cannot name the question, it is vague
rather than curious. If the line already answers it, the loop is shut.

**Best source of gaps:** something the product measures about the reader's own
thing that the reader cannot see for themselves. That is honest by
construction, because you are not withholding, you are revealing.

**State the recurring offer, not the trial.** "Your first one free" shrinks a
standing offer to a single shot in the reader's head.

**The SEO tension, resolved.** Gap titles and search pull opposite ways: search
wants the term in the title, the gap wants it withheld. Split the slots. The h1
and the social share open the gap; the title tag, meta description, and any
stat field carry the term and the number.

---

## The 21 principles

Mechanism and guardrail only. The product mapping for each lives in
`CALIBRATION.md`.

**01. Gold gradient effect.** Warm metallic gradients read as premium before a
word is processed. The *gradient* is the mechanism; a flat warm colour is not
the same thing. *Guardrail: one warm accent per asset, and never a colour the
design system already spends on status.*

**02. Von Restorff.** In a set, the one item that looks different is the one
remembered and clicked. *Guardrail: this is a property of the set, not of an
item. A per-item rule produces a partition, and a partition has no odd one out.
If the different-looking thing appears more than once, the effect is off.*

**03. Framing.** The same fact, worded as gain or loss, count or percentage,
produces different decisions. *Guardrail: write every headline number three
ways before picking. Reframing chooses which true sentence leads; it never asks
the reader to misread the number.*

**04. Choice architecture.** Order, defaults, *number of options*, and visual
hierarchy decide the outcome more than the options do. Pre-highlight the one
you want; neutral layouts are not neutral acts. *Guardrail: making a good
choice easier is fair, making a bad choice harder to notice is not. Defaults
inside a product are a product decision.*

**05. Information gap.** See above. The lead technique.

**06. Endowment.** People value what feels theirs, and giving it up registers as
a loss even when nothing was paid. Strongest when the artefact is something the
user already identifies with. *Guardrail: possession must be felt, not merely
implemented, and never claimed for something the reader has not made.*

**07. Peak-end.** An experience is remembered by its most intense moment and its
ending. *Guardrail: every piece needs one designated peak and one designated
last line. If you cannot point at the peak, there is not one.*

**08. Choice overload.** Past a small number of options, more people decide
nothing. Three or fewer. *Guardrail: three is a ceiling, not a target. When
options differ on a single axis, one is the right number. Fewer options for the
reader, not less rigour for us.*

**09. Pratfall.** A competent brand becomes more likeable after admitting a
small, real flaw. *Guardrail: the flaw must be real, minor, and paired with a
visible fix. An admission with nothing behind it is just bad news.*

**10. Vibe branding.** People buy a feeling and a self-image before a feature
list. *Guardrail: start from what the reader wants, not from what we admire
about ourselves. Producer-side virtues are not positioning. Vibe is
consistency, not mood-per-post.*

**11. Commitment and consistency.** A small yes makes the next, larger yes
easier. *Guardrail: each rung must be worth taking on its own. A first step
whose only purpose is to enable the second is a trick.*

**12. Anchoring.** The first number seen becomes the ruler for the rest.
*Guardrail: the anchor has to be real. Scale and alternative cost are fair
anchors; a struck-through price never charged is not.*

**13. Loss aversion.** A loss is felt about twice as strongly as an equivalent
gain. *Guardrail: frame the loss as effort or value the reader controls, never
as their odds, their worth, or their identity. Check who the audience is before
using this at all.*

**14. Fresh start effect.** Motivation spikes after a temporal landmark.
*Guardrail: identify the landmarks that are real for this audience rather than
defaulting to New Year.*

**15. Processing fluency.** Easier to read is judged more true. *Guardrail:
fluency applies to the prose, not to the caveats. Definitions and limitations
stay.*

**16. Rule of 7.** Roughly seven exposures before action. One placement is not
a test. *Guardrail: repeat the message, not the asset.*

**17. Scarcity vs urgency.** Scarcity is limited quantity, urgency is limited
time. *Guardrail: use only where a real cap or a real deadline exists.
Fabricated ones get noticed and cost more than they earn.*

**18. Decoy effect.** A third, weaker option shifts preference between the
first two. *Guardrail: understand it so you can name it when a competitor does
it. Adding options to a product's own pricing is a pricing decision.*

**19. Social proof.** Under uncertainty, people copy others. Proof belongs next
to the decision, not in a footer. *Guardrail: every proof point is a number and
inherits the numbers rule.*

**20. Reciprocity.** Value received creates an obligation to return it.
*Guardrail: the gift must be usable without buying. Withholding the payoff
behind a form spends the trust the gift was meant to build.*

**21. Zeigarnik.** Unfinished tasks hold attention until closed. *Guardrail:
only loops the reader actually left open. A progress bar that fills when we say
so is a fake countdown wearing a different hat.*

---

## The house rhetorical move

**Define by contrast with the lazy alternative.** When a claim feels flat, name
the version it is *not*. This is reusable across products and is usually the
difference between a line that states a feature and one that lands.

---

## Pre-publish pass

1. **Gap.** Does the hook open a loop, or answer it in the title?
2. **Frame.** Was the headline number written at least three ways?
3. **Peak.** Can you point at the single strongest moment? Is it early enough?
4. **End.** Is the last line the point, and would someone quote it?
5. **Fluency.** Any sentence you had to read twice? Any banned house words?
6. **Contrast.** Is exactly one element different, and is it the one that
   matters?
7. **Proof.** Is the strongest verified number adjacent to the ask?
8. **Ladder.** Is the ask the next rung, not three rungs up?
9. **Honesty sweep.** Every number verified, every scarcity and urgency claim
   real, no possession claimed that the reader does not hold.

Item 9 is the one that is not negotiable. The other eight make a true claim
land harder; that one keeps it true.
