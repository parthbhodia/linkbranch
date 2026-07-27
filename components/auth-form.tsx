"use client";

import { useState } from "react";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(
    searchParams.get("error")
      ? { severity: "error", text: "That confirmation link could not be completed." }
      : null,
  );

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
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/templates`,
          data: {
            full_name: displayName.trim(),
            username: cleanUsername,
          },
        },
      });

      if (error) {
        setMessage({ severity: "error", text: error.message });
      } else if (data.session) {
        router.push("/templates");
        router.refresh();
      } else {
        setMessage({
          severity: "success",
          text: "Account created. Check your email to confirm your address.",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ severity: "error", text: "Email or password is incorrect." });
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link className="brand" href="/" aria-label="Linkbranch home">
          link<span>branch</span><i>.</i>
        </Link>
        <Box className="auth-story__copy">
          <p className="section-label">YOUR CORNER OF THE INTERNET</p>
          <Typography component="h1" variant="h1">
            One profile.<br />
            Every useful <span className="headline-accent">branch.</span>
          </Typography>
          <Typography sx={{ mt: 2.5, maxWidth: 470 }} color="text.secondary">
            Publish your work, referral offers, and favorite resources without
            handing your audience to an algorithm.
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Your data stays attached to your account.
        </Typography>
      </section>

      <section className="auth-panel">
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

          <Stack component="form" spacing={2.25} sx={{ mt: 3 }} onSubmit={submit}>
            {mode === "signup" && (
              <>
                <TextField
                  label="Display name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  autoComplete="name"
                />
                <TextField
                  label="Username"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value.replace(/\s/g, "").toLowerCase())
                  }
                  required
                  helperText="Your public address will be linkbranch.com/u/username"
                  autoComplete="username"
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
            />
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
              disabled={loading}
              endIcon={loading ? <CircularProgress size={18} /> : <ArrowForwardRounded />}
            >
              {loading
                ? "Please wait"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </Stack>
        </Paper>
      </section>
    </main>
  );
}
