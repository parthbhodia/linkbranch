# Cueful

A focused creator page for links, referral offers, and useful audience signals.
Built with Next.js, React, TypeScript, Material UI, and Supabase.

Creators can:

- create an email/password account and return through a protected dashboard;
- choose one of three profile templates;
- edit their intro, social profiles, links, and referral offers;
- hide content without deleting it and spotlight one primary link;
- publish a public page at `cueful.bio/[username]`;
- track link opens, referral opens, and coupon copies.

Production domain: [cueful.bio](https://cueful.bio).

Supabase Auth owns sessions. Postgres stores account content and interaction
events. Row Level Security limits private reads and all creator mutations to
the account owner.

## Run locally

Node.js 22 or newer is required.

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local`, add the Supabase project URL and
publishable key, then open [http://localhost:3000](http://localhost:3000).

## Supabase

Run the SQL files in `supabase/migrations` in filename order. They create:

- profiles, links, referrals, social links, and click events;
- ownership and public-read RLS policies;
- an account-profile trigger and atomic onboarding save function;
- a public avatar bucket with owner-only write policies.

Never expose a Supabase secret or service-role key through a `NEXT_PUBLIC_`
environment variable.

## Apple Wallet passes

`/api/wallet/<username>` serves the profile as a signed `.pkpass`, and `/card`
offers it as **Add to Apple Wallet**. It is worth having alongside the QR
screen because it wins on things a web page cannot control: it opens from the
lock screen, Wallet forces the display to maximum brightness for a barcode, and
it syncs to Apple Watch without a watch app. The format shipped in iOS 6 and
has stayed compatible, so it works on far older iPhones than any recent
sharing feature.

The barcode carries the same profile URL `/card` encodes, so a scanner cannot
tell the two apart.

**Passes are static.** There is no update web service, so a pass shows the
profile as it was when it was downloaded — edit your details and you must add
the card again. The pass says so on its back. Adding live updates means four
registration endpoints, a device registry, and APNs push; it is deliberately
not built until someone asks for it.

Signing needs an Apple Developer Program membership and a Pass Type ID
certificate. Set these five, all server-only, none prefixed `NEXT_PUBLIC_`:

| Variable | Notes |
| --- | --- |
| `APPLE_PASS_TYPE_ID` | e.g. `pass.bio.cueful.card` |
| `APPLE_TEAM_ID` | 10-character team identifier |
| `APPLE_PASS_SIGNER_CERT_BASE64` | Pass certificate, PEM, base64 |
| `APPLE_PASS_SIGNER_KEY_BASE64` | Its private key, PEM, base64 |
| `APPLE_WWDR_CERT_BASE64` | **G4 only** — G2/G3/G5/G6 fail validation |

`APPLE_PASS_SIGNER_KEY_PASSPHRASE` is needed only if the key is encrypted.

With any of them missing the feature turns itself off: the route 404s and the
button never renders. A leaked signing certificate lets anyone issue passes in
your name, so treat these like the service-role key.

Extracting the PEMs from the `.p12` Keychain exports:

```bash
openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out signerCert.pem
openssl pkcs12 -in Certificates.p12 -nocerts -out signerKey.pem
base64 -w0 signerCert.pem
```

Pass images live in `assets/wallet` and are regenerated from the 512px
monogram with `node scripts/generate-wallet-images.mjs`. They are read at
request time, so `next.config.ts` traces them into the serverless bundle
explicitly — nothing imports them and tracing cannot otherwise infer it.

### Supabase MCP server

`.mcp.json` is checked in, so Claude Code picks the server up on clone and
nobody has to re-add it. It holds only the URL and the project ref — the server
authenticates per developer over OAuth, which is why no token belongs in it.

Authenticate once, in a regular terminal rather than an IDE extension:

```bash
claude /mcp
```

Select `supabase`, then Authenticate. Until that finishes the server is
configured but unreachable, and calls come back as a permission error rather
than a connection failure — the misleading part is that it looks like the wrong
project rather than a missing login.

To re-add the server by hand, or to point it at a different project:

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=<ref>&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching"
```

That feature list includes `database`, `development` and `branching`, all of
which can write. Append `&read_only=true` for a session that should only be
able to read production.

Optional, and local to your machine rather than the repo — ready-made Supabase
instructions for the agent:

```bash
npx skills add supabase/agent-skills
```

## Hosting

Deploy the Next.js app to Vercel and keep Supabase as the backend. GitHub Pages
is not suitable for the authenticated server-rendered routes and session
middleware used by this project. Railway is not required for this architecture.

In the Vercel project, add these variables for Production, Preview, and
Development:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

`NEXT_PUBLIC_GA_ID` is optional. Set it to a GA4 measurement id
(`G-XXXXXXXXXX`) to load the Google tag; leave it unset and no Google script is
requested at all, which is how local and preview builds should stay. Set it on
Production only unless you want preview traffic in the same property.

The tag is loaded site-wide from the root layout, so it covers public creator
profiles as well as the marketing pages. Google's tag sets cookies, so
visitors in the EU/UK need a consent gate before it fires -- that is not built
yet. Vercel Analytics runs alongside it and is cookieless, so it keeps
reporting regardless.

The authenticated pages are explicitly server-rendered, so a missing Vercel
variable no longer crashes static-page generation during `pnpm run build`.
Those variables are still required at runtime for sign-up, sign-in, account
recovery, the dashboard, onboarding, and public profile data.

Add the deployed URL to the Supabase Auth redirect allow list. The app handles
confirmation, expired links, cross-browser recovery failures, forgot-password
requests, password updates, and successful verification on dedicated routes
under `/auth`.
