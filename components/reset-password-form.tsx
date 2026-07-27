"use client";

import { useState } from "react";
import LockResetRounded from "@mui/icons-material/LockResetRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/auth/password-updated");
    router.refresh();
  }

  return (
    <AuthFrame>
      <Paper className="auth-card" variant="outlined">
        <LockResetRounded className="auth-form__lead-icon" aria-hidden="true" />
        <Typography className="section-label" component="p">
          SECURE YOUR ACCOUNT
        </Typography>
        <Typography component="h2" variant="h2">
          Choose a new password
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Use a password you have not used for this account before.
        </Typography>

        <Stack component="form" spacing={2} sx={{ mt: 4 }} onSubmit={submit}>
          <TextField
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            inputProps={{ minLength: 8 }}
            helperText="At least 8 characters."
            required
            autoFocus
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            inputProps={{ minLength: 8 }}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving}
            startIcon={
              saving ? <CircularProgress size={18} /> : <LockResetRounded />
            }
          >
            {saving ? "Updating" : "Update password"}
          </Button>
        </Stack>
      </Paper>
    </AuthFrame>
  );
}
