"use client";

import { useMemo, useState } from "react";
import CheckCircleOutlineRounded from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import FavoriteBorderRounded from "@mui/icons-material/FavoriteBorderRounded";
import LinkRounded from "@mui/icons-material/LinkRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";

type ScanResult = {
  id: string;
  type: "Link" | "Referral" | "Product" | "Media";
  title: string;
  url: string;
  status: "healthy" | "broken";
  statusCode: number | null;
};

export function LinkHealthScanner() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "healthy" | "broken">("all");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? results
        : results.filter((item) => item.status === filter),
    [filter, results],
  );
  const healthy = results.filter((item) => item.status === "healthy").length;
  const broken = results.length - healthy;

  async function scan() {
    setScanning(true);
    setError(null);
    try {
      const response = await fetch("/api/link-health", { method: "POST" });
      const payload = (await response.json()) as {
        error?: string;
        checkedAt?: string;
        results?: ScanResult[];
      };
      if (!response.ok || !payload.results || !payload.checkedAt) {
        throw new Error(payload.error ?? "The link scan could not be completed.");
      }
      setResults(payload.results);
      setCheckedAt(payload.checkedAt);
      setFilter("all");
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : "The link scan could not be completed.",
      );
    } finally {
      setScanning(false);
    }
  }

  return (
    <StackLike>
      <Paper className="link-health-hero" variant="outlined">
        <Chip
          icon={<FavoriteBorderRounded />}
          label="LINK HEALTH"
          size="small"
          variant="outlined"
        />
        <Typography variant="h2">Link scanner</Typography>
        <Typography variant="body2" color="text.secondary">
          {checkedAt
            ? `Last scan ${new Date(checkedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "Check the live destinations on your page."}
        </Typography>
        <Button
          variant="contained"
          startIcon={
            scanning ? <CircularProgress size={17} /> : <RefreshRounded />
          }
          onClick={scan}
          disabled={scanning}
        >
          {scanning ? "Scanning…" : results.length ? "Scan again" : "Scan links"}
        </Button>
        <div className="link-health-stats">
          <span>
            <small>Total</small>
            <b>{results.length || "—"}</b>
          </span>
          <span>
            <small>Healthy</small>
            <b className="is-healthy">{results.length ? healthy : "—"}</b>
          </span>
          <span>
            <small>Broken</small>
            <b className="is-broken">{results.length ? broken : "—"}</b>
          </span>
          <span>
            <small>Unchecked</small>
            <b>{results.length ? 0 : "—"}</b>
          </span>
        </div>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {results.length > 0 && (
        <>
          <Alert severity={broken ? "warning" : "success"} variant="outlined">
            {broken
              ? `Found ${broken} destination${broken === 1 ? "" : "s"} that need attention.`
              : "Every checked destination is responding."}
          </Alert>
          <Paper className="link-health-results" variant="outlined">
            <div className="link-health-filters" aria-label="Filter scan results">
              {(["all", "healthy", "broken"] as const).map((value) => {
                const count =
                  value === "all" ? results.length : value === "healthy" ? healthy : broken;
                return (
                  <ButtonBase
                    className={filter === value ? "is-active" : ""}
                    onClick={() => setFilter(value)}
                    aria-pressed={filter === value}
                    key={value}
                  >
                    {value} <span>{count}</span>
                  </ButtonBase>
                );
              })}
            </div>
            <div className="link-health-list">
              {filtered.map((item) => (
                <article className={`is-${item.status}`} key={item.id}>
                  <span className="link-health-list__icon">
                    <LinkRounded />
                  </span>
                  <div>
                    <Typography fontWeight={850}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.url}
                    </Typography>
                    <small>
                      {item.type}
                      {item.statusCode ? ` · HTTP ${item.statusCode}` : ""}
                    </small>
                  </div>
                  <Chip
                    size="small"
                    icon={
                      item.status === "healthy" ? (
                        <CheckCircleOutlineRounded />
                      ) : (
                        <ErrorOutlineRounded />
                      )
                    }
                    label={item.status}
                    variant="outlined"
                  />
                  <Button
                    component="a"
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${item.title}`}
                  >
                    <OpenInNewRounded />
                  </Button>
                </article>
              ))}
            </div>
          </Paper>
        </>
      )}

      {!results.length && !scanning && (
        <Box className="workspace-empty link-health-empty">
          <FavoriteBorderRounded />
          <Typography variant="h3">No scan yet</Typography>
          <Typography variant="body2" color="text.secondary">
            Run a scan to check links, referral offers, products, and media.
          </Typography>
        </Box>
      )}
    </StackLike>
  );
}

function StackLike({ children }: { children: React.ReactNode }) {
  return <div className="link-health">{children}</div>;
}
