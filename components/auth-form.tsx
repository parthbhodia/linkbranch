"use client";

import { useState } from "react";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import GoogleIcon from "@mui/icons-material/Google";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { createClient } from "@/lib/supabase/client";
import { publicProfileAddress } from "@/lib/brand";
import { stashPendingEmail } from "@/lib/pending-email";

type AuthMode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode: AuthMode =
    searchParams.get("mode") === "login" ? "login" : "signup";
  const initialNotice = searchParams.get("notice");
  const initialError = searchParams.get("error");
  const isImportFlow = searchParams.get("import") === "1";
  const selectedTemplate = searchParams.get("template") ?? "field-notes";
  // Set when the visitor arrived from an outreach page at /claim/[token].
  // It has to survive every branch below: whichever way they authenticate,
  // the draft is only applied once they land back with a session.
  const claimToken = searchParams.get("claim")?.trim() ?? "";
  const nextPath = claimToken
    ? `/claim/apply?token=${encodeURIComponent(claimToken)}`
    : isImportFlow
      ? `/onboarding?template=${encodeURIComponent(selectedTemplate)}&import=1`
      : "/templates";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [displayName, setDisplayName] = useState(
    searchParams.get("display_name")?.trim() ?? "",
  );
  const [username, setUsername] = useState(
    searchParams.get("username")?.trim().toLowerCase() ?? "",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(() => {
    if (initialNotice === "confirmed_sign_in") {
      return {
        severity: "success",
        text: "Your email is confirmed. Sign in with the password you created.",
      };
    }

    if (initialError === "confirmation_invalid") {
      return {
        severity: "error",
        text: "This confirmation link is invalid or has already been used. If you already confirmed your email, sign in below.",
      };
    }

    return null;
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signup") {
      const cleanUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(cleanUsername)) {
        setMessage({
          severity: "error",
          text: "Username must be 3–30 characters using letters, numbers, hyphens, or underscores.",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          data: {
            full_name: displayName.trim(),
            username: cleanUsername,
          },
        },
      });

      if (error) {
        setMessage({ severity: "error", text: error.message });
      } else if (data.user && data.user.identities?.length === 0) {
        // Supabase's email-enumeration protection does not error when the
        // address is already registered and confirmed. It returns a decoy user
        // with no identities and no session, which is otherwise indistinguishable
        // from a fresh signup -- so without this branch the visitor is sent to
        // "check your inbox" to wait for an email that never comes.
        setMessage({
          severity: "error",
          text: "An account with this email already exists. Sign in instead.",
        });
      } else if (data.session) {
        router.push(nextPath);
        router.refresh();
      } else {
        stashPendingEmail(email);
        router.push("/auth/check-email?type=confirmation");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === "email_not_confirmed") {
          stashPendingEmail(email);
          router.push("/auth/check-email?type=confirmation");
          return;
        }
        setMessage({
          severity: "error",
          text: "Email or password is incorrect.",
        });
      } else {
        if (claimToken || isImportFlow) {
          router.push(nextPath);
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .single();
          router.push(profile?.onboarding_completed ? "/dashboard" : "/templates");
        }
        router.refresh();
      }
    }

    setLoading(false);
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setMessage(null);

    // Same callback the email links use: it exchanges the code for a session
    // and forwards to `next`, so the claim and import flows work identically
    // whichever way the account was created.
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    // On success the browser has already left for Google, so only the failure
    // path needs to put the button back.
    if (error) {
      setMessage({ severity: "error", text: error.message });
      setGoogleLoading(false);
    }
  }

  return (
    <AuthFrame>
        <Paper className="auth-card" variant="outlined">
          <Typography component="h2" variant="h2">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {mode === "signup"
              ? "Start with a free profile. You can publish after onboarding."
              : "Sign in to edit your page and view activity."}
          </Typography>

          <Tabs
            value={mode}
            onChange={(_, value: AuthMode) => {
              setMode(value);
              setMessage(null);
            }}
            sx={{ mt: 3 }}
          >
            <Tab label="Create account" value="signup" />
            <Tab label="Sign in" value="login" />
          </Tabs>

          <Button
            onClick={signInWithGoogle}
            variant="outlined"
            size="large"
            fullWidth
            disabled={loading || googleLoading}
            startIcon={
              googleLoading ? <CircularProgress size={18} /> : <GoogleIcon />
            }
            sx={{ mt: 3 }}
          >
            {googleLoading ? "Redirecting" : "Continue with Google"}
          </Button>

          <Divider sx={{ mt: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              or
            </Typography>
          </Divider>

          <Stack component="form" spacing={2.25} sx={{ mt: 3 }} onSubmit={submit}>
            {mode === "signup" && (
              <>
                <TextField
                  label="Display name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  autoComplete="name"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Username"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value.replace(/\s/g, "").toLowerCase())
                  }
                  required
                  helperText={`Your public address will be ${publicProfileAddress(username || "username")}`}
                  autoComplete="username"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </>
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              inputProps={{ minLength: 8 }}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              helperText={mode === "signup" ? "Use at least 8 characters." : undefined}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {mode === "login" && (
              <Box className="auth-form__forgot">
                <Link href="/auth/forgot-password">Forgot password?</Link>
              </Box>
            )}
            {message && (
              <Alert
                severity={message.severity}
                icon={
                  message.severity === "success" ? (
                    <CheckCircleOutlineRounded />
                  ) : undefined
                }
              >
                {message.text}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || googleLoading}
              endIcon={loading ? <CircularProgress size={18} /> : <ArrowForwardRounded />}
            >
              {loading
                ? "Please wait"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </Button>
            {mode === "signup" && (
              <Typography className="auth-form__legal" variant="caption">
                By creating an account you agree to the{" "}
                <Link href="/terms">Terms of Service</Link> and{" "}
                <Link href="/privacy">Privacy Policy</Link>.
              </Typography>
            )}
          </Stack>
        </Paper>
    </AuthFrame>
  );
}
