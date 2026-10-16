"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TEMPLATE_PICKER, postAuthDestination } from "@/lib/post-auth-destination";

/**
 * Google One Tap: the prompt that drops in from the top-right for someone who
 * is already signed in to Google.
 *
 * Not the same mechanism as the Google button in the auth form. That one calls
 * signInWithOAuth and leaves the page for Google's consent screen. This renders
 * in place, hands back an ID token, and exchanges it for a session without the
 * visitor going anywhere -- which is the point for a returning user who already
 * has an account and does not need to be asked anything.
 *
 * Renders no markup of its own; Google draws the prompt.
 */

type CredentialResponse = { credential?: string };

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (config: Record<string, unknown>) => void;
      prompt: () => void;
      cancel: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

const GIS_SRC = "https://accounts.google.com/gsi/client";

/**
 * Supabase verifies the nonce by hashing what we give it and comparing against
 * the one Google embedded in the token, so Google gets the hash and Supabase
 * gets the original. Sending the same value to both fails with "Nonces
 * mismatch", which is the usual way this goes wrong in production.
 */
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const raw = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

function loadGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("gis")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("gis"));
    document.head.appendChild(script);
  });
}

export function GoogleOneTap({ next = TEMPLATE_PICKER }: { next?: string }) {
  const router = useRouter();
  // Strict mode mounts twice in development, and prompting twice gets the
  // prompt suppressed by Google rather than shown twice.
  const started = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    // Unconfigured is a normal state, not a failure: the ordinary Google button
    // still works, so the prompt is simply absent until a client id is set.
    if (!clientId || started.current) return;
    started.current = true;

    let cancelled = false;

    (async () => {
      const supabase = createClient();

      // Nothing to offer someone who is already signed in.
      const { data } = await supabase.auth.getSession();
      if (data.session || cancelled) return;

      try {
        await loadGis();
      } catch {
        // Blocked by an extension, offline, or Google is down. The button in
        // the auth form is the fallback, so this stays silent.
        return;
      }
      if (cancelled || !window.google?.accounts?.id) return;

      const { raw, hashed } = await makeNonce();
      if (cancelled) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashed,
        // Third-party cookies are going away and the old prompt went with
        // them; FedCM is what Chrome shows now.
        use_fedcm_for_prompt: true,
        auto_select: true,
        cancel_on_tap_outside: false,
        callback: async (response: CredentialResponse) => {
          if (!response.credential) return;

          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce: raw,
          });
          if (error || cancelled) return;

          // Same rule the callback route and the password form use, so a
          // returning user lands on their dashboard rather than on the
          // template picker they worked through months ago.
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .single();

          router.push(
            postAuthDestination({
              requested: next,
              onboardingCompleted: Boolean(profile?.onboarding_completed),
            }),
          );
          router.refresh();
        },
      });

      window.google.accounts.id.prompt();
    })();

    return () => {
      cancelled = true;
      window.google?.accounts?.id?.cancel();
    };
  }, [next, router]);

  return null;
}
