"use client";

import { useState } from "react";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      },
    );

    setSending(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }

    router.push("/auth/check-email?type=recovery");
  }

  return (
    <AuthFrame>
      <Paper className="auth-card" variant="outlined">
        <Typography className="section-label" component="p">
          ACCOUNT RECOVERY
        </Typography>
        <Typography component="h2" variant="h2">
          Reset your password
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Enter the email attached to your account. We will send one secure
          reset link.
        </Typography>

        <Stack component="form" spacing={2} sx={{ mt: 4 }} onSubmit={submit}>
          <TextField
            label="Account email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            autoFocus
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={sending}
            endIcon={
              sending ? <CircularProgress size={18} /> : <ArrowForwardRounded />
            }
          >
            {sending ? "Sending" : "Send reset link"}
          </Button>
          <Button component={Link} href="/auth?mode=login" color="inherit">
            Back to sign in
          </Button>
        </Stack>
      </Paper>
    </AuthFrame>
  );
}
