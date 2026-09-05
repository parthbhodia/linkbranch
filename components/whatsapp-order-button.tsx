"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  buildWhatsAppUrl,
  normalizeWhatsAppNumber,
  orderMessage,
  parseWhatsAppUrl,
} from "@/lib/whatsapp";

const REMEMBERED_NUMBER_KEY = "cueful:whatsapp-number";

function rememberedNumber(): string {
  try {
    return window.localStorage.getItem(REMEMBERED_NUMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberNumber(number: string) {
  try {
    window.localStorage.setItem(REMEMBERED_NUMBER_KEY, number);
  } catch {
    // Private mode or blocked storage: the number is simply asked for again.
  }
}

/**
 * Turns a shop card's button into "message us on WhatsApp" without a schema
 * change: the result is an ordinary https URL written into the item's link
 * field. Offered beside that field in both places a product is edited.
 */
export function WhatsAppOrderButton({
  itemTitle,
  currentUrl,
  onPick,
  disabled = false,
}: {
  itemTitle: string;
  /** The item's current link, so an existing chat link is edited, not replaced blind. */
  currentUrl: string;
  /** Receives the chat URL and a button label to go with it. */
  onPick: (url: string, ctaLabel: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);

  const digits = normalizeWhatsAppNumber(number);
  const url = digits ? buildWhatsAppUrl(digits, message) : null;

  function start() {
    const existing = parseWhatsAppUrl(currentUrl);
    setNumber(existing?.number ?? rememberedNumber());
    setMessage(existing?.message || orderMessage(itemTitle));
    setTouched(false);
    setOpen(true);
  }

  function confirm() {
    if (!url || !digits) {
      setTouched(true);
      return;
    }
    rememberNumber(digits);
    onPick(url, "Order on WhatsApp");
    setOpen(false);
  }

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<WhatsAppIcon />}
        onClick={start}
        disabled={disabled}
        sx={{ whiteSpace: "nowrap" }}
      >
        Take orders on WhatsApp
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Order on WhatsApp</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The button opens a chat with you, with this message already typed.
            No checkout needed.
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Your WhatsApp number"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="+91 98765 43210"
              helperText={
                touched && !digits
                  ? "Include the country code, e.g. +91 for India."
                  : "With country code. Never shown; it lives inside the link."
              }
              error={touched && !digits}
              autoFocus
              fullWidth
              slotProps={{ htmlInput: { inputMode: "tel", maxLength: 24 } }}
            />
            <TextField
              label="Message the customer starts with"
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 200))}
              multiline
              minRows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirm} disabled={!url}>
            Use this
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
