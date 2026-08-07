"use client";

import { useState } from "react";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import SendRounded from "@mui/icons-material/SendRounded";
import {
  Alert,
  Button,
  Chip,
  Collapse,
  TextField,
  Typography,
} from "@mui/material";
import { createClient } from "@/lib/supabase/client";

/**
 * The exchange block. Two halves, because a one-way tap is the thing people
 * actually complain about: they hand over their details and walk away with
 * nothing. "Save my contact" is the card. "Send me yours" is the half every
 * NFC card is missing.
 */
export function ContactExchange({
  profileId,
  username,
  displayName,
  eventTag,
  allowSaveContact,
  allowExchange,
}: {
  profileId?: string;
  username: string;
  displayName: string;
  eventTag?: string | null;
  allowSaveContact: boolean;
  allowExchange: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const firstName = displayName.trim().split(/\s+/)[0] || displayName;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("A name is the one field that matters. Add yours.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError("Add an email or a phone number so they can reach you.");
      return;
    }

    if (!profileId) {
      setStatus("sent");
      return;
    }

    setStatus("saving");
    const supabase = createClient();
    // status, source, event_tag and met_at are stamped server-side by a
    // trigger -- a visitor cannot file themselves under a different event or
    // pre-sort themselves into a pile.
    const { error: insertError } = await supabase.from("connections").insert({
      profile_id: profileId,
      name: name.trim().slice(0, 100),
      email: email.trim().slice(0, 254),
      phone: phone.trim().slice(0, 32),
      company: company.trim().slice(0, 100),
      note: note.trim().slice(0, 2000),
    });

    if (insertError) {
      setStatus("error");
      setError("That didn’t send. Check the fields and try again.");
      return;
    }

    setStatus("sent");
  }

  if (!allowSaveContact && !allowExchange) return null;

  return (
    <div className="contact-exchange">
      <div className="contact-exchange__head">
        <BadgeOutlined fontSize="small" aria-hidden="true" />
        <div>
          <Typography component="h2" className="contact-exchange__title">
            Swap details with {firstName}
          </Typography>
          <Typography variant="body2" className="contact-exchange__sub">
            Save the card, and send yours back so it goes both ways.
          </Typography>
        </div>
      </div>

      {eventTag ? (
        <Chip
          className="contact-exchange__event"
          size="small"
          icon={<PlaceOutlined />}
          label={`At ${eventTag}`}
        />
      ) : null}

      <div className="contact-exchange__actions">
        {allowSaveContact && (
          <Button
            component="a"
            href={`/api/vcard/${username}`}
            variant="contained"
            startIcon={<DownloadRounded />}
            className="contact-exchange__save"
          >
            Save my contact
          </Button>
        )}
        {allowExchange && status !== "sent" && (
          <Button
            variant="outlined"
            startIcon={<SendRounded />}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            {open ? "Close" : "Send me yours"}
          </Button>
        )}
      </div>

      {status === "sent" ? (
        <Alert severity="success" className="contact-exchange__done">
          {profileId
            ? `Sent. ${firstName} has your details${
                eventTag ? ` from ${eventTag}` : ""
              }.`
            : "Form preview ready."}
        </Alert>
      ) : (
        allowExchange && (
          <Collapse in={open} unmountOnExit>
            <form className="contact-exchange__form" onSubmit={onSubmit}>
              <div className="contact-exchange__fields">
                <TextField
                  label="Your name"
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
                  fullWidth
                  size="small"
                  autoComplete="email"
                  disabled={status === "saving"}
                />
                <TextField
                  label="Phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  fullWidth
                  size="small"
                  autoComplete="tel"
                  disabled={status === "saving"}
                />
                <TextField
                  label="Company"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  fullWidth
                  size="small"
                  autoComplete="organization"
                  disabled={status === "saving"}
                />
              </div>
              <TextField
                label="What did you talk about?"
                placeholder="The bit they’ll want to remember tomorrow morning."
                value={note}
                onChange={(event) => setNote(event.target.value)}
                fullWidth
                size="small"
                multiline
                minRows={2}
                disabled={status === "saving"}
              />
              {error && <Alert severity="error">{error}</Alert>}
              <Button
                type="submit"
                variant="contained"
                disabled={status === "saving"}
                startIcon={<SendRounded />}
              >
                {status === "saving" ? "Sending…" : "Send my details"}
              </Button>
            </form>
          </Collapse>
        )
      )}
    </div>
  );
}
