"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { createClient } from "@/lib/supabase/client";

export function ProfileContactForm({
  profileId,
  displayName,
}: {
  profileId?: string;
  displayName: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!profileId) {
      setStatus("sent");
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    const { error: insertError } = await supabase.from("contact_submissions").insert({
      profile_id: profileId,
      name: name.trim().slice(0, 100),
      email: email.trim().slice(0, 254),
      message: message.trim().slice(0, 2000),
    });

    if (insertError) {
      setStatus("error");
      setError("Couldn’t send that. Check the fields and try again.");
      return;
    }

    setName("");
    setEmail("");
    setMessage("");
    setStatus("sent");
  }

  return (
    <form className="profile-contact-form" onSubmit={onSubmit}>
      <div>
        <Typography variant="h3">Say hello</Typography>
        <Typography variant="body2" color="text.secondary">
          Send a note to {displayName}. They’ll see it in their Cueful inbox.
        </Typography>
      </div>
      <div className="profile-contact-form__fields">
        <TextField
          label="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          fullWidth
          size="small"
          autoComplete="name"
          disabled={status === "saving"}
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          fullWidth
          size="small"
          autoComplete="email"
          disabled={status === "saving"}
        />
        <TextField
          label="Message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          fullWidth
          size="small"
          multiline
          minRows={3}
          disabled={status === "saving"}
        />
      </div>
      {error && <Alert severity="error">{error}</Alert>}
      {status === "sent" && (
        <Alert severity="success">
          {profileId ? "Sent. Thanks for reaching out." : "Form preview ready."}
        </Alert>
      )}
      <Button type="submit" variant="contained" disabled={status === "saving"}>
        {status === "saving" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
