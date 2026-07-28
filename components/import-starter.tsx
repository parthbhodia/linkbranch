"use client";

import { useState } from "react";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
import {
  Alert,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IMPORT_DRAFT_STORAGE_KEY,
  type ImportedProfileDraft,
} from "@/lib/import-draft";

export function ImportStarter({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function importProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/import/linktree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const result = (await response.json()) as ImportedProfileDraft & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "That profile could not be imported.");
      }

      window.sessionStorage.setItem(
        IMPORT_DRAFT_STORAGE_KEY,
        JSON.stringify(result),
      );
      router.push("/templates?import=1");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "That profile could not be imported.",
      );
      setLoading(false);
    }
  }

  return (
    <div
      className={`import-starter${compact ? " import-starter--compact" : ""}`}
      id="import"
    >
      <div className="import-starter__intro">
        <span>{compact ? "SWITCH IN SECONDS" : "COMING FROM LINKTREE?"}</span>
        <Typography component="p">
          {compact
            ? "Paste your public Linktree URL. You’ll review everything before publishing."
            : "Paste your public page to carry over your profile, links, and social accounts. You review everything before it goes live."}
        </Typography>
      </div>
      <form onSubmit={importProfile}>
        <TextField
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="linktr.ee/yourname"
          aria-label="Your public Linktree URL"
          required
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          slotProps={{
            input: {
              startAdornment: <AutoAwesomeRounded fontSize="small" />,
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          endIcon={
            loading ? <CircularProgress size={17} /> : <ArrowForwardRounded />
          }
          disabled={loading}
        >
          {loading ? "Importing…" : compact ? "Import Linktree" : "Import my page"}
        </Button>
      </form>
      {error && <Alert severity="error">{error}</Alert>}
      {!compact && (
        <Typography component="p">
          No Linktree page? <Link href="/auth">Start fresh instead.</Link>
        </Typography>
      )}
    </div>
  );
}
