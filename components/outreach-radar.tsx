"use client";

import { useMemo, useState, useTransition } from "react";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import XIcon from "@mui/icons-material/X";
import ForumRounded from "@mui/icons-material/ForumRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  outreachStatuses,
  type OutreachPlatform,
  type OutreachStatus,
  type OutreachTarget,
} from "@/lib/outreach";

type Props = {
  initialTargets: OutreachTarget[];
};

const statusColor: Record<
  OutreachStatus,
  "default" | "info" | "success" | "warning" | "error"
> = {
  new: "info",
  queued: "warning",
  replied: "success",
  skipped: "default",
  won: "success",
};

function PlatformIcon({ platform }: { platform: OutreachPlatform }) {
  if (platform === "twitter") return <XIcon fontSize="small" />;
  return <ForumRounded fontSize="small" />;
}

export function OutreachRadar({ initialTargets }: Props) {
  const [targets, setTargets] = useState(initialTargets);
  const [platform, setPlatform] = useState<"all" | OutreachPlatform>("all");
  const [status, setStatus] = useState<"all" | OutreachStatus>("all");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return targets
      .filter((item) => (platform === "all" ? true : item.platform === platform))
      .filter((item) => (status === "all" ? true : item.status === status))
      .filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.body.toLowerCase().includes(q) ||
          (item.author ?? "").toLowerCase().includes(q) ||
          (item.community ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.target_score - a.target_score);
  }, [targets, platform, status, query]);

  const counts = useMemo(() => {
    const byStatus = Object.fromEntries(
      outreachStatuses.map((s) => [s, 0]),
    ) as Record<OutreachStatus, number>;
    let reddit = 0;
    let twitter = 0;
    for (const item of targets) {
      byStatus[item.status] += 1;
      if (item.platform === "reddit") reddit += 1;
      if (item.platform === "twitter") twitter += 1;
    }
    return { byStatus, reddit, twitter, total: targets.length };
  }, [targets]);

  async function patchTarget(
    id: string,
    patch: Partial<Pick<OutreachTarget, "status" | "notes" | "reply_draft">>,
  ) {
    setError(null);
    const response = await fetch("/api/outreach/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const payload = (await response.json()) as {
      error?: string;
      item?: OutreachTarget;
    };
    if (!response.ok || !payload.item) {
      throw new Error(payload.error ?? "Update failed.");
    }
    setTargets((prev) =>
      prev.map((item) => (item.id === id ? payload.item! : item)),
    );
  }

  function importSeed() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/outreach/seed", { method: "POST" });
        const payload = (await response.json()) as {
          error?: string;
          imported?: number;
          reddit?: number;
          twitter?: number;
          items?: OutreachTarget[];
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Import failed.");
        }
        if (payload.items) {
          // Reload full list from server shape — merge by platform+external_id
          const responseList = await fetch("/api/outreach/list");
          const listPayload = (await responseList.json()) as {
            items?: OutreachTarget[];
            error?: string;
          };
          if (listPayload.items) setTargets(listPayload.items);
        }
        setMessage(
          `Imported ${payload.imported ?? 0} targets (${payload.reddit ?? 0} Reddit · ${payload.twitter ?? 0} X).`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed.");
      }
    });
  }

  async function copyDraft(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage("Reply draft copied.");
  }

  return (
    <Stack spacing={2.5}>
      <Box className="outreach-hero">
        <Chip label="OUTREACH RADAR" size="small" variant="outlined" />
        <Typography variant="h2">Posts to target</Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={560}>
          Reddit + X threads where people want a Linktree alternative. Queue a
          reply, skip noise, mark wins.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1}>
          <Chip label={`${counts.total} total`} size="small" />
          <Chip
            icon={<ForumRounded />}
            label={`${counts.reddit} Reddit`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<XIcon />}
            label={`${counts.twitter} X`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${counts.byStatus.new} new`}
            size="small"
            color="info"
            variant="outlined"
          />
          <Chip
            label={`${counts.byStatus.queued} queued`}
            size="small"
            color="warning"
            variant="outlined"
          />
          <Chip
            label={`${counts.byStatus.replied} replied`}
            size="small"
            color="success"
            variant="outlined"
          />
        </Stack>
        <Stack direction="row" spacing={1} mt={2}>
          <Button
            variant="contained"
            startIcon={
              pending ? <CircularProgress size={16} /> : <RefreshRounded />
            }
            onClick={importSeed}
            disabled={pending}
          >
            {pending ? "Importing…" : "Import Reddit + X scan"}
          </Button>
        </Stack>
      </Box>

      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ sm: "center" }}
      >
        <TextField
          size="small"
          placeholder="Search title, body, author…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <SearchRounded fontSize="small" sx={{ mr: 1, opacity: 0.5 }} />
            ),
          }}
          sx={{ flex: 1 }}
        />
        <TextField
          select
          size="small"
          label="Platform"
          value={platform}
          onChange={(e) =>
            setPlatform(e.target.value as "all" | OutreachPlatform)
          }
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="reddit">Reddit</MenuItem>
          <MenuItem value="twitter">X / Twitter</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "all" | OutreachStatus)
          }
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All</MenuItem>
          {outreachStatuses.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack spacing={1.5}>
        {filtered.length === 0 && (
          <Alert severity="info">
            No targets yet. Import a Reddit + X scan, or adjust filters.
          </Alert>
        )}
        {filtered.map((item) => (
          <Box key={item.id} className="outreach-card">
            <Stack
              direction="row"
              justifyContent="space-between"
              gap={1}
              alignItems="flex-start"
            >
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<PlatformIcon platform={item.platform} />}
                  label={item.platform === "twitter" ? "X" : "Reddit"}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`score ${item.target_score}`}
                  size="small"
                  color={item.target_score >= 70 ? "success" : "default"}
                />
                <Chip
                  label={item.status}
                  size="small"
                  color={statusColor[item.status]}
                />
                {item.community && (
                  <Chip label={`r/${item.community}`} size="small" variant="outlined" />
                )}
                {item.author && (
                  <Typography variant="body2" color="text.secondary">
                    @{item.author}
                  </Typography>
                )}
              </Stack>
              <Button
                size="small"
                href={item.url}
                target="_blank"
                rel="noreferrer"
                endIcon={<OpenInNewRounded />}
              >
                Open
              </Button>
            </Stack>

            <Typography variant="h3" mt={1.25}>
              {item.title}
            </Typography>
            {item.body && (
              <Typography
                variant="body2"
                color="text.secondary"
                mt={0.75}
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.body}
              </Typography>
            )}

            <Stack direction="row" spacing={2} mt={1}>
              <Typography variant="body2" color="text.secondary">
                ↑ {item.score}
                {item.platform === "reddit" ? ` · 💬 ${item.comments}` : ""}
              </Typography>
            </Stack>

            <TextField
              label="Reply draft"
              value={item.reply_draft}
              onChange={(e) =>
                setTargets((prev) =>
                  prev.map((t) =>
                    t.id === item.id
                      ? { ...t, reply_draft: e.target.value }
                      : t,
                  ),
                )
              }
              onBlur={() =>
                void patchTarget(item.id, { reply_draft: item.reply_draft })
              }
              multiline
              minRows={2}
              fullWidth
              sx={{ mt: 1.5 }}
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              mt={1.5}
              alignItems={{ sm: "center" }}
            >
              <TextField
                select
                size="small"
                label="Status"
                value={item.status}
                onChange={(e) => {
                  const next = e.target.value as OutreachStatus;
                  setTargets((prev) =>
                    prev.map((t) =>
                      t.id === item.id ? { ...t, status: next } : t,
                    ),
                  );
                  void patchTarget(item.id, { status: next });
                }}
                sx={{ minWidth: 140 }}
              >
                {outreachStatuses.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyRounded />}
                onClick={() => void copyDraft(item.reply_draft)}
              >
                Copy draft
              </Button>
              <TextField
                size="small"
                label="Notes"
                value={item.notes}
                onChange={(e) =>
                  setTargets((prev) =>
                    prev.map((t) =>
                      t.id === item.id ? { ...t, notes: e.target.value } : t,
                    ),
                  )
                }
                onBlur={() => void patchTarget(item.id, { notes: item.notes })}
                sx={{ flex: 1 }}
              />
            </Stack>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
