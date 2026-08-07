"use client";

import { useEffect, useState } from "react";
import SendRounded from "@mui/icons-material/SendRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import { createClient } from "@/lib/supabase/client";
import { readPendingEmail } from "@/lib/pending-email";

export function ResendConfirmationForm() {
  const [email, setEmail] = useState("");
  // The page server-renders, and sessionStorage only exists on the client, so
  // the stashed address can only arrive after mount. This is the "sync from an
  // external system" case the rule below exists to carve out for: it costs one
  // extra render on an otherwise static page, which is a better trade than
  // putting the address in the URL where history and logs would keep it.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setEmail(readPendingEmail()), []);
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
        ? {
            severity: "error",
            // Supabase throttles auth mail per recipient -- the SMTP settings
            // put that at 60 seconds, so someone who signs up and immediately
            // hits resend lands here. Its own copy quotes an interval that does
            // not match what we configured, so say it ourselves.
            text:
              error.code === "over_email_send_rate_limit"
                ? "A confirmation email just went out. Give it a minute before asking for another."
                : error.message,
          }
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
