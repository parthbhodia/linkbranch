"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
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
import { creatorBadgeUrl } from "@/lib/referrals";
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
      <span
        className={`link-index${link.thumbnailUrl ? " link-index--image" : ""}`}
        style={{ background: link.color }}
      >
        {link.thumbnailUrl ? (
          <Box
            component="img"
            src={link.thumbnailUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          link.index
        )}
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
      <span className="link-card__arrow" aria-hidden="true">
        <ArrowOutwardRounded fontSize="small" />
      </span>
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
  showBadge = false,
}: {
  profile: CreatorProfile;
  template?: string;
  databaseProfileId?: string;
  published?: boolean;
  showBadge?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<{
    message: string;
    severity: "success" | "info" | "warning" | "error";
  } | null>(
    published
      ? { message: "Profile saved and published", severity: "success" }
      : null,
  );
  const viewRecorded = useRef(false);

  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!databaseProfileId || viewRecorded.current) return;
    viewRecorded.current = true;

    void fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: databaseProfileId,
        referrer: document.referrer || null,
      }),
    });
  }, [databaseProfileId]);

  useEffect(() => {
    if (!databaseProfileId) return;
    let active = true;
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setIsOwner(data.user?.id === databaseProfileId);
      });
    return () => {
      active = false;
    };
  }, [databaseProfileId]);

  const sharePage = useCallback(async () => {
    const url = window.location.href;
    // Native sheet on mobile (where this page is mostly opened); clipboard
    // everywhere else. Ignore AbortError -- that is the user cancelling.
    if (navigator.share) {
      try {
        await navigator.share({ title: profile.displayName, url });
        return;
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNotice({ message: "Link copied", severity: "success" });
    } catch {
      setNotice({ message: url, severity: "info" });
    }
  }, [profile.displayName]);

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
      <article className="creator-card">
        <header className="profile-panel" aria-label="Creator profile">
          <div className="profile-brand-row">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <span className="profile-handle">@{profile.username}</span>
              <Tooltip title="Share this page" arrow>
                <IconButton size="small" onClick={sharePage} aria-label="Share this page">
                  <IosShareRounded fontSize="small" />
                </IconButton>
              </Tooltip>
              {/* Owner-only: visiting your own public page is the most natural
                  moment to want to change it, and there was no route back. */}
              {isOwner && (
                <Tooltip title="Edit your page" arrow>
                  <IconButton
                    size="small"
                    component={Link}
                    href="/dashboard"
                    aria-label="Edit your page"
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </div>

          <Box className="profile-copy">
            <Box
              className={`avatar${profile.avatarUrl ? " avatar--image" : ""}`}
              aria-label={
                profile.avatarUrl
                  ? `${profile.displayName} profile photo`
                  : `${profile.displayName} initials`
              }
            >
              {profile.avatarUrl ? (
                <Box
                  component="img"
                  src={profile.avatarUrl}
                  alt={`${profile.displayName} profile`}
                />
              ) : (
                <Typography sx={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem" }}>
                  {profile.initials}
                </Typography>
              )}
            </Box>
            <p className="eyebrow">{profile.eyebrow}</p>
            <Typography component="h1" variant="h1">
              {profile.greeting} {profile.displayName}.
            </Typography>
            <Typography component="h2" className="profile-headline">
              {profile.headline}{" "}
              <span className="headline-accent">{profile.headlineAccent}</span>
            </Typography>
            <Typography className="profile-bio" color="text.secondary">
              {profile.bio}
            </Typography>
          </Box>

          {profile.socials.length > 0 && (
            <nav className="social-rail" aria-label="Social profiles">
            {profile.socials.map((social) => (
                <Tooltip title={social.platform} arrow key={social.platform}>
                  <IconButton
                key={social.platform}
                component="a"
                href={social.url}
                target="_blank"
                rel="noreferrer"
                    aria-label={`Open ${social.platform}`}
                onClick={() => track(`Opened ${social.platform}`)}
              >
                    {getSocialPlatformIcon(social.platform)}
                  </IconButton>
                </Tooltip>
            ))}
          </nav>
          )}
        </header>

        <section className="hub-panel">
          <div className="profile-search">
          <TextField
            className="search-field"
              placeholder="Search links, coupons, or keywords…"
            type="search"
            size="small"
              fullWidth
            value={query}
            onChange={(event) => setQuery(event.target.value)}
              inputProps={{ "aria-label": "Search links, coupons, or keywords" }}
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
          </div>

          {filtered.referrals.length > 0 && (
            <section className="content-section content-section--perks" aria-labelledby="pocket-perks">
              <div className="section-heading">
                <Typography id="pocket-perks" component="h2" className="section-label">
                  Perks & referrals
                </Typography>
                <Typography variant="caption" color="text.secondary">Swipe →</Typography>
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

        {spotlightLinks.length > 0 && (
          <section className="content-section" aria-labelledby="featured-links">
            <div className="section-heading">
                <Typography id="featured-links" component="h2" className="section-label">
                  Featured
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
                <Typography id="all-links" component="h2" className="section-label">
                  My links
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

        {totalResults === 0 && (
          <Box className="empty-state">
            <Typography variant="h3">Nothing matches yet.</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ my: 1.5 }}>
              Try another keyword or clear the search to see everything.
            </Typography>
            <Button variant="contained" onClick={() => setQuery("")}>Clear search</Button>
          </Box>
        )}

        </section>
        {showBadge && (
          <footer className="profile-supporter-badge">
            <a href={creatorBadgeUrl(profile.username)}>
              <span>Made with</span>
              <b>cueful.</b>
              <ArrowOutwardRounded aria-hidden="true" />
            </a>
          </footer>
        )}
      </article>

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
