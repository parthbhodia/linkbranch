"use client";

import { useState } from "react";
import SendRounded from "@mui/icons-material/SendRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import { createClient } from "@/lib/supabase/client";

export function ResendConfirmationForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);

  async function resend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/templates`,
      },
    });

    setSending(false);
    setMessage(
      error
        ? { severity: "error", text: error.message }
        : {
            severity: "success",
            text: "A fresh confirmation email is on its way.",
          },
    );
  }

  return (
    <Stack
      component="form"
      className="auth-inline-form"
      spacing={1.5}
      onSubmit={resend}
    >
      <TextField
        label="Account email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
        fullWidth
        slotProps={{ inputLabel: { shrink: true } }}
      />
      {message && <Alert severity={message.severity}>{message.text}</Alert>}
      <Button
        type="submit"
        variant="outlined"
        disabled={sending}
        startIcon={
          sending ? <CircularProgress size={17} /> : <SendRounded />
        }
      >
        {sending ? "Sending" : "Resend confirmation"}
      </Button>
    </Stack>
  );
}
