import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The last step of the claim flow, and the piece that was missing: /claim/
// [token] renders the preview and sends the visitor to /auth carrying the
// token, but claim_draft() requires an authenticated caller, so the draft can
// only be applied once they come back with a session. This route is the `next`
// target of that round trip -- for password sign-in, for email confirmation,
// and for the OAuth callback alike.

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session yet -- a confirmation link opened in a different browser from
  // the one that started sign-up lands here signed out. Send them back through
  // sign-in still carrying the token rather than dropping the draft on the
  // floor; the whole point of the outreach link is that they do not have to
  // rebuild the page by hand.
  if (!user) {
    return NextResponse.redirect(
      new URL(
        `/auth?mode=login&claim=${encodeURIComponent(token)}`,
        requestUrl.origin,
      ),
    );
  }

  const { error } = await supabase.rpc("claim_draft", { draft_token: token });

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/error?code=claim_failed", requestUrl.origin),
    );
  }

  // claim_draft() sets onboarding_completed, so the page is live already.
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
