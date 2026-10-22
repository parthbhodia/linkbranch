import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasCompletedOnboarding } from "@/lib/onboarding-status";
import {
  TEMPLATE_PICKER,
  isInternalPath,
  postAuthDestination,
} from "@/lib/post-auth-destination";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = requestUrl.searchParams.get("next");
  // Kept for the failure branches below, which need somewhere to send people
  // before there is a session to ask questions about.
  const next = isInternalPath(requestedNext) ? requestedNext : TEMPLATE_PICKER;
  const supabase = await createClient();

  /**
   * Where to go once the exchange has worked.
   *
   * The caller's `next` is decided before anyone is signed in, so for a plain
   * sign-in it is always the template picker -- which is why signing in with
   * Google used to show that picker to people who finished setup long ago.
   * Now the question is asked at the only point it can be answered, and it is
   * asked about the account that just signed in rather than about whichever
   * profile row the reader happened to return first.
   */
  async function destination(userId: string | null | undefined) {
    if (isInternalPath(requestedNext) && requestedNext !== TEMPLATE_PICKER) {
      return requestedNext;
    }
    const onboardingCompleted = await hasCompletedOnboarding(supabase, userId);
    return postAuthDestination({ requested: requestedNext, onboardingCompleted });
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        new URL(await destination(data.user?.id), requestUrl.origin),
      );
    }

    // The email can be confirmed successfully while the session exchange fails
    // if the link opens in a different browser from the one that started PKCE.
    // The user can safely continue by signing in with the password they created.
    return NextResponse.redirect(
      new URL(
        next === "/auth/reset-password"
          ? "/auth/error?code=recovery_session_missing"
          : "/auth/confirmed",
        requestUrl.origin,
      ),
    );
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      return NextResponse.redirect(
        new URL(await destination(data.user?.id), requestUrl.origin),
      );
    }

    return NextResponse.redirect(
      new URL("/auth/error?code=link_invalid", requestUrl.origin),
    );
  }

  return NextResponse.redirect(
    new URL("/auth/error?code=link_invalid", requestUrl.origin),
  );
}
