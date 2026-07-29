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

The authenticated pages are explicitly server-rendered, so a missing Vercel
variable no longer crashes static-page generation during `pnpm run build`.
Those variables are still required at runtime for sign-up, sign-in, account
recovery, the dashboard, onboarding, and public profile data.

Add the deployed URL to the Supabase Auth redirect allow list. The app handles
confirmation, expired links, cross-browser recovery failures, forgot-password
requests, password updates, and successful verification on dedicated routes
under `/auth`.
