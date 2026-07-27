"use client";

import { useEffect, useState } from "react";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { Button, CircularProgress, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BRAND_NAME, PUBLIC_PROFILE_PREFIX, publicProfileAddress } from "@/lib/brand";

type Availability = "idle" | "checking" | "available" | "taken" | "invalid" | "unknown";

const usernamePattern = /^[a-z0-9][a-z0-9_-]{2,29}$/;

export function UsernameClaim({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [availability, setAvailability] = useState<Availability>("idle");

  useEffect(() => {
    const cleanUsername = username.trim().toLowerCase();

    if (!usernamePattern.test(cleanUsername)) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("is_username_available", {
          candidate: cleanUsername,
        });

        if (error) {
          setAvailability("unknown");
          return;
        }

        setAvailability(data ? "available" : "taken");
      } catch {
        setAvailability("unknown");
      }
    }, 380);

    return () => window.clearTimeout(timeout);
  }, [username]);

  function claim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (!usernamePattern.test(cleanUsername)) {
      setAvailability("invalid");
      return;
    }

    if (availability === "taken") {
      return;
    }

    router.push(`/auth?mode=signup&username=${encodeURIComponent(cleanUsername)}`);
  }

  const helperText =
    availability === "available"
      ? "It’s available. Nice choice."
      : availability === "taken"
        ? "That username is already taken."
        : availability === "invalid"
          ? "Use 3–30 letters, numbers, hyphens, or underscores."
          : availability === "unknown"
            ? "We’ll confirm availability when you create your account."
            : compact
              ? `Your public page: ${publicProfileAddress()}`
              : "Choose the address you’ll share everywhere.";

  return (
    <form
      className={`username-claim${compact ? " username-claim--compact" : ""}`}
      onSubmit={claim}
    >
      <div className="username-claim__field">
        <span aria-hidden="true">{PUBLIC_PROFILE_PREFIX}</span>
        <TextField
          name="username"
          value={username}
          onChange={(event) => {
            const nextUsername = event.target.value
                .replace(/^@/, "")
                .replace(/\s/g, "")
                .toLowerCase();
            setUsername(nextUsername);
            setAvailability(
              !nextUsername
                ? "idle"
                : usernamePattern.test(nextUsername)
                  ? "checking"
                  : "invalid",
            );
          }}
          placeholder="yourname"
          variant="standard"
          error={availability === "taken" || availability === "invalid"}
          inputProps={{
            "aria-label": `Claim your ${BRAND_NAME} username`,
            maxLength: 30,
            autoCapitalize: "none",
            autoCorrect: "off",
            autoComplete: "username",
            spellCheck: false,
            inputMode: "text",
          }}
          InputProps={{
            disableUnderline: true,
            endAdornment:
              availability === "checking" ? (
                <CircularProgress size={18} />
              ) : availability === "available" ? (
                <CheckCircleRounded color="success" fontSize="small" />
              ) : null,
          }}
        />
      </div>
      <Button
        type="submit"
        variant="contained"
        endIcon={<ArrowForwardRounded />}
        disabled={availability === "checking" || availability === "taken"}
      >
        Claim my page
      </Button>
      <Typography
        className={`username-claim__helper username-claim__helper--${availability}`}
        component="p"
        aria-live="polite"
      >
        {helperText}
      </Typography>
    </form>
  );
}
