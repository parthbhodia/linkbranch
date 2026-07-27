import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = requestUrl.searchParams.get("next") ?? "/templates";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/templates";
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
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
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    return NextResponse.redirect(
      new URL("/auth/error?code=link_invalid", requestUrl.origin),
    );
  }

  return NextResponse.redirect(
    new URL("/auth/error?code=link_invalid", requestUrl.origin),
  );
}
