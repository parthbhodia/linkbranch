# Claim drafts

One JSON file per business we want to pitch. Each one becomes a row in
`public.claim_drafts` and a page at `cueful.bio/claim/<token>` that is already
filled in with their links — they sign up and the page becomes theirs.

```bash
# validate + print the INSERT, nothing is written
node scripts/create-claim-draft.mjs drafts/nails-by-lana.json

# insert it (needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
node scripts/create-claim-draft.mjs drafts/nails-by-lana.json --apply
```

The script prints the claim path. That URL is the only thing protecting the
draft: `claim_drafts` grants nothing to `anon`, `get_claim_draft()` needs the
exact token, and `/claim/[token]` is `noindex` — so send it to one recipient
and nowhere else. Drafts expire after 30 days (`expires_in_days` to change it).

## Fields

| Field | Limit | Notes |
| --- | --- | --- |
| `source_url` | http(s) | Where the content came from. Shown on the claim page as "Built from …". |
| `suggested_username` | 3–30, `a-z0-9_-` | Checked for availability when the page renders. |
| `display_name` | 80 | |
| `greeting` | 32 | Renders as `{greeting} {display_name}.` |
| `headline` / `headline_accent` | 48 / 24 | Render as one line, accent coloured. |
| `eyebrow` | 60 | Small line above the name. Defaults to `@username`. |
| `bio` | 160 | |
| `tags` | 16 entries, 40 each | Chips under the intro. |
| `template` | `field-notes`, `after-dark`, `soft-studio`, `signal-deck` | |
| `links[]` | title 100, subtitle 100, http(s) url | Order is preserved. |
| `socials[]` | `platform` must match a label in `lib/social-platforms.tsx` | Anything else falls back to a generic globe icon. |

Only use details the business has already published. The pitch is that we read
their public page carefully, so a wrong price or a stale address costs more than
a missing one.

## Tracking

`public.claim_draft_status` has view counts, first/last open, and who claimed —
the view ping is client-side, so link-preview crawlers don't inflate it.
