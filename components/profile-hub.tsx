"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import BoltRounded from "@mui/icons-material/BoltRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { CreatorProfile, LinkItem, Referral } from "@/lib/types";
import { getSocialPlatformIcon } from "@/lib/social-platforms";
import { createClient } from "@/lib/supabase/client";

type TrackTarget = {
  eventType: "link_open" | "referral_open" | "referral_copy";
  linkId?: number;
  referralId?: number;
};

function searchable(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

const LinkCard = memo(function LinkCard({
  link,
  onOpen,
}: {
  link: LinkItem;
  onOpen: (label: string, target: TrackTarget) => void;
}) {
  return (
    <Box
      component="a"
      className={`link-card${link.featured ? " link-card--featured" : ""}`}
      href={link.url}
      target="_blank"
      rel="noreferrer"
      onClick={() =>
        onOpen(`Opened ${link.title}`, {
          eventType: "link_open",
          linkId: Number(link.id),
        })
      }
    >
      <span className="link-index" style={{ background: link.color }}>
        {link.index}
      </span>
      <span>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h3">{link.title}</Typography>
          {link.featured && (
            <Chip
              className="featured-chip"
              icon={<StarRounded />}
              label="Spotlight"
              size="small"
            />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {link.subtitle}
        </Typography>
      </span>
      <Stack alignItems="flex-end" spacing={0.5}>
        <Typography variant="caption" color="text.secondary">
          {link.visits} visits
        </Typography>
        <ArrowOutwardRounded fontSize="small" />
      </Stack>
    </Box>
  );
});

function ReferralCard({
  referral,
  onCopy,
  onOpen,
}: {
  referral: Referral;
  onCopy: (code: string, provider: string, referralId: number) => void;
  onOpen: (label: string, target: TrackTarget) => void;
}) {
  return (
    <Box className="perk-card" style={{ background: referral.color }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" sx={{ opacity: 0.78, letterSpacing: "0.08em" }}>
          {referral.provider.toUpperCase()} / REFERRAL
        </Typography>
        <Tooltip title={`Open ${referral.provider} offer`} arrow>
          <IconButton
            component="a"
            href={referral.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${referral.provider} offer`}
            onClick={() =>
              onOpen(`Opened ${referral.provider} offer`, {
                eventType: "referral_open",
                referralId: Number(referral.id),
              })
            }
            sx={{ color: "inherit", zIndex: 1 }}
          >
            <ArrowOutwardRounded />
          </IconButton>
        </Tooltip>
      </Stack>
      <Typography variant="h3" sx={{ mt: 1.5, maxWidth: 190, fontSize: "1.125rem" }}>
        {referral.perk}
      </Typography>
      {referral.code ? (
        <Button
          className="perk-action"
          variant="contained"
          startIcon={<ContentCopyRounded />}
          onClick={() =>
            onCopy(referral.code!, referral.provider, Number(referral.id))
          }
        >
          Copy · {referral.code}
        </Button>
      ) : (
        <Button
          className="perk-action"
          component="a"
          href={referral.url}
          target="_blank"
          rel="noreferrer"
          variant="contained"
          endIcon={<ArrowOutwardRounded />}
          onClick={() =>
            onOpen(`Opened ${referral.provider} offer`, {
              eventType: "referral_open",
              referralId: Number(referral.id),
            })
          }
        >
          Claim offer
        </Button>
      )}
    </Box>
  );
}

export function ProfileHub({
  profile,
  template = "field-notes",
  databaseProfileId,
  published = false,
}: {
  profile: CreatorProfile;
  template?: string;
  databaseProfileId?: string;
  published?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [interactions, setInteractions] = useState(0);
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "info" | "warning" | "error";
  } | null>(
    published
      ? { message: "Profile saved and published", severity: "success" }
      : null,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return {
      links: profile.links.filter((item) =>
        searchable([item.title, item.subtitle, ...item.tags]).includes(needle),
      ),
      referrals: profile.referrals.filter((item) =>
        searchable([item.provider, item.perk, item.code, ...item.tags]).includes(needle),
      ),
    };
  }, [profile, query]);

  const track = useCallback((label: string, target?: TrackTarget) => {
    setInteractions((current) => current + 1);
    setNotice({ message: label, severity: "info" });
    if (databaseProfileId && target) {
      const supabase = createClient();
      void supabase.from("click_events").insert({
        profile_id: databaseProfileId,
        event_type: target.eventType,
        link_id: target.linkId ?? null,
        referral_id: target.referralId ?? null,
        referrer: document.referrer || null,
      });
    }
  }, [databaseProfileId]);

  const copyCode = useCallback(async (
    code: string,
    provider: string,
    referralId: number,
  ) => {
    try {
      await navigator.clipboard.writeText(code);
      track(`${provider} code copied`, {
        eventType: "referral_copy",
        referralId,
      });
    } catch {
      setNotice({ message: `Copy failed. Code: ${code}`, severity: "error" });
    }
  }, [track]);

  const totalResults = filtered.links.length + filtered.referrals.length;
  const spotlightLinks = filtered.links.filter((link) => link.featured);
  const standardLinks = filtered.links.filter((link) => !link.featured);

  return (
    <main className={`app-shell public-template public-template--${template}`}>
      <aside className="profile-panel" aria-label="Creator profile">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Link className="brand" href="/" aria-label="Linkbranch home">
            link<span>branch</span><i>.</i>
          </Link>
          <Chip icon={<BoltRounded />} label="Online" size="small" variant="outlined" />
        </Stack>

        <Box className="profile-copy">
          <Box className="avatar" aria-label={`${profile.displayName} initials`}>
            <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem" }}>
              {profile.initials}
            </Typography>
          </Box>
          <p className="eyebrow">{profile.eyebrow}</p>
          <Typography component="h1" variant="h1">
            {profile.greeting} {profile.displayName}.<br />
            {profile.headline}{" "}
            <span className="headline-accent">{profile.headlineAccent}</span>
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2.5, maxWidth: 450 }}>
            {profile.bio}
          </Typography>
        </Box>

        <Box>
          <nav className="social-rail" aria-label="Social profiles">
            {profile.socials.map((social) => (
              <Button
                key={social.platform}
                component="a"
                href={social.url}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                size="small"
                startIcon={getSocialPlatformIcon(social.platform)}
                endIcon={<ArrowOutwardRounded />}
                onClick={() => track(`Opened ${social.platform}`)}
              >
                {social.platform}
              </Button>
            ))}
          </nav>
        </Box>
      </aside>

      <section className="hub-panel">
        <header className="hub-header">
          <Box>
            <p className="section-label">01 / THE GOOD STUFF</p>
            <Typography component="h2" variant="h2">Pick a branch.</Typography>
          </Box>
          <TextField
            className="search-field"
            label="Search the stack"
            type="search"
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded />
                  </InputAdornment>
                ),
              },
            }}
          />
        </header>

        {spotlightLinks.length > 0 && (
          <section className="content-section" aria-labelledby="featured-links">
            <div className="section-heading">
              <Typography id="featured-links" component="h3" variant="h3">
                Spotlight
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {query ? `${totalResults} results` : "Curated, not crowded"}
              </Typography>
            </div>
            <div className="link-list">
              {spotlightLinks.map((link) => (
                <LinkCard key={link.id} link={link} onOpen={track} />
              ))}
            </div>
          </section>
        )}

        {standardLinks.length > 0 && (
          <section className="content-section" aria-labelledby="all-links">
            <div className="section-heading">
              <Typography id="all-links" component="h3" variant="h3">
                Links
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {query ? `${totalResults} results` : `${standardLinks.length} destinations`}
              </Typography>
            </div>
            <div className="link-list">
              {standardLinks.map((link) => (
                <LinkCard key={link.id} link={link} onOpen={track} />
              ))}
            </div>
          </section>
        )}

        {filtered.referrals.length > 0 && (
          <section className="content-section" aria-labelledby="pocket-perks">
            <div className="section-heading">
              <Typography id="pocket-perks" component="h3" variant="h3">
                Pocket perks
              </Typography>
              <Typography variant="caption" color="text.secondary">Swipe to explore →</Typography>
            </div>
            <div className="perk-rail">
              {filtered.referrals.map((referral) => (
                <ReferralCard
                  key={referral.id}
                  referral={referral}
                  onCopy={copyCode}
                  onOpen={track}
                />
              ))}
            </div>
          </section>
        )}

        {totalResults === 0 && (
          <Box className="empty-state">
            <Typography variant="h3">No branch found.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ my: 1.5 }}>
              Try another keyword or clear the search to see everything.
            </Typography>
            <Button variant="contained" onClick={() => setQuery("")}>Clear search</Button>
          </Box>
        )}

        <footer className="hub-footer">
          <Typography variant="caption" color="text.secondary">
            Make your own{" "}
            <Link href="/auth"><strong>linkbranch ↗</strong></Link>
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            color="primary"
            label={`${interactions} interactions this visit`}
          />
        </footer>
      </section>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={2800}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notice?.severity ?? "info"}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ width: "100%" }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </main>
  );
}
