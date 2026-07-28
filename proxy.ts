import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Single-segment paths that belong to the app rather than to a creator.
// Rewriting cueful.bio/<name> to /u/<name> puts app routes and usernames in one
// namespace, and this list is what decides which side wins.
//
// Doing it in middleware rather than moving app/u/[username] to app/[username]
// has two advantages: /u/<name> keeps working, so links already shared stay
// valid; and the exclusion list is one readable place instead of being implied
// by the folder tree.
//
// This does NOT replace public.reserved_usernames. The collision is in the
// namespace, not the routing — if someone registers "dashboard" and a
// /dashboard route exists, their page is unreachable however the URL resolves.
// Middleware decides resolution; the reserved table stops the name being taken.
const APP_ROUTES = new Set([
  "auth",
  "claim",
  "dashboard",
  "demo",
  "discover",
  "es",
  "it",
  "onboarding",
  "opengraph-image",
  "templates",
  "u",
  "api",
  "best-link-in-bio-tools",
  "cueful-vs-beacons",
  "cueful-vs-carrd",
  "free-link-in-bio",
  "free-linktree-alternative",
  "link-in-bio-for-instagram",
  "link-in-bio-for-tiktok",
  "link-in-bio-tools",
  "what-does-link-in-bio-mean",
]);

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;

export async function proxy(request: NextRequest) {
  const sessionResponse = await updateSession(request);
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);

  if (segments.length !== 1) return sessionResponse;

  const segment = segments[0];
  if (APP_ROUTES.has(segment)) return sessionResponse;
  // A dot means a generated file (robots.txt, sitemap.xml, manifest.webmanifest);
  // the username constraint disallows dots, so this can never be a profile.
  if (segment.includes(".")) return sessionResponse;
  if (!USERNAME_PATTERN.test(segment)) return sessionResponse;

  const url = request.nextUrl.clone();
  url.pathname = `/u/${segment}`;
  const rewritten = NextResponse.rewrite(url);

  // updateSession refreshes Supabase auth cookies onto its own response.
  // Returning a bare rewrite would drop them and sign the user out on every
  // profile visit, so carry them across.
  sessionResponse.cookies.getAll().forEach((cookie) => {
    rewritten.cookies.set(cookie);
  });
  return rewritten;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
