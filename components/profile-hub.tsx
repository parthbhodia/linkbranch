"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import LinkRounded from "@mui/icons-material/LinkRounded";
import MusicNoteRounded from "@mui/icons-material/MusicNoteRounded";
import PlayCircleOutlineRounded from "@mui/icons-material/PlayCircleOutlineRounded";
import QrCode2Rounded from "@mui/icons-material/QrCode2Rounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  bookingEmbedUrl,
  detectBookingProvider,
  isLikelyCompleteBookingUrl,
} from "@/lib/booking-providers";
import { ContactExchange } from "@/components/contact-exchange";
import { ProfileContactForm } from "@/components/profile-contact-form";
import {
  detectMusicProvider,
  isLikelyCompleteMusicUrl,
  musicEmbedHeight,
  musicPlayerUrl,
  musicProviderLabel,
} from "@/lib/music-providers";
import QRCode from "qrcode";
import type { CreatorProfile, LinkItem, Referral } from "@/lib/types";
import { creatorBadgeUrl } from "@/lib/referrals";
import { getSocialPlatformIcon } from "@/lib/social-platforms";
import { publicProfileAddress } from "@/lib/brand";
import { publicAssetUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import {
  profileThemeClassName,
  profileThemeStyle,
  readableForeground,
  resolveProfileTheme,
} from "@/lib/theme-config";

type TrackTarget = {
  eventType:
    | "link_open"
    | "referral_open"
    | "referral_copy"
    | "product_open"
    | "media_open";
  linkId?: number;
  referralId?: number;
  productId?: number;
  mediaEmbedId?: number;
};

export type PublicProduct = {
  id: number;
  title: string;
  description: string;
  price_amount: number | string | null;
  currency: string;
  category: string;
  badge: string | null;
  image_path: string | null;
  destination_url: string;
  cta_label: string;
  is_featured: boolean;
};

export type PublicMediaEmbed = {
  id: number;
  title: string;
  provider: string;
  url: string;
  layout: string;
};

export type PublicFaq = {
  id: number;
  question: string;
  answer: string;
};

export type PublicHighlight = {
  id: number;
  image_path: string;
  title: string;
  destination_url: string | null;
  expires_at: string;
};

function mediaPlayerUrl(item: PublicMediaEmbed) {
  const parentHost =
    typeof window !== "undefined" ? window.location.hostname : undefined;
  return musicPlayerUrl(item.url, item.provider as Parameters<typeof musicPlayerUrl>[1], {
    parentHost,
  });
}

function formatPrice(item: PublicProduct) {
  if (item.price_amount === null || item.price_amount === "") return null;
  const amount = Number(item.price_amount);
  if (!Number.isFinite(amount)) return null;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: item.currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${item.currency} ${amount}`;
  }
}

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
  const [showEmbed, setShowEmbed] = useState(false);
  const music = detectMusicProvider(link.url);
  const booking = music ? null : detectBookingProvider(link.url);
  const musicEmbedSrc =
    music?.embeddable && isLikelyCompleteMusicUrl(link.url)
      ? musicPlayerUrl(link.url, music.id, {
          parentHost:
            typeof window !== "undefined" ? window.location.hostname : undefined,
        })
      : null;
  const bookingEmbedSrc =
    booking?.embeddable && isLikelyCompleteBookingUrl(link.url)
      ? bookingEmbedUrl(link.url, booking.id)
      : null;
  const embedSrc = musicEmbedSrc || bookingEmbedSrc;
  const subtitle =
    link.subtitle ||
    (music ? music.subtitle : null) ||
    (booking ? booking.subtitle : null) ||
    "";

  return (
    <div
      className={`link-card-wrap${music ? " link-card-wrap--music" : ""}${
        booking ? " link-card-wrap--booking" : ""
      }`}
    >
      <Box
        component="a"
        className={`link-card${link.featured ? " link-card--featured" : ""}${
          music ? " link-card--music" : ""
        }${booking ? " link-card--booking" : ""}`}
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
          className={`link-index${
            link.thumbnailUrl
              ? " link-index--image"
              : music
                ? " link-index--music"
                : booking
                  ? " link-index--booking"
                  : " link-index--icon"
          }`}
          style={{
            background: music || booking ? undefined : link.color,
          }}
        >
          {link.thumbnailUrl ? (
            <Box
              component="img"
              src={link.thumbnailUrl}
              alt=""
              loading="lazy"
            />
          ) : music ? (
            <MusicNoteRounded fontSize="small" />
          ) : booking ? (
            <CalendarMonthRounded fontSize="small" />
          ) : link.featured ? (
            <StarRounded fontSize="small" />
          ) : (
            <LinkRounded fontSize="small" />
          )}
        </span>
        <span>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h3">{link.title}</Typography>
            {music && (
              <Chip className="music-chip" label={music.label} size="small" />
            )}
            {booking && (
              <Chip
                className="booking-chip"
                label={booking.label}
                size="small"
              />
            )}
            {link.featured && !music && !booking && (
              <Chip
                className="featured-chip"
                icon={<StarRounded />}
                label="Spotlight"
                size="small"
              />
            )}
          </Stack>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </span>
        <span className="link-card__arrow" aria-hidden="true">
          <ArrowOutwardRounded fontSize="small" />
        </span>
      </Box>
      {embedSrc ? (
        <div className={music ? "music-embed" : "booking-embed"}>
          <Button
            size="small"
            variant="outlined"
            className={
              music ? "music-embed__toggle" : "booking-embed__toggle"
            }
            onClick={() => setShowEmbed((open) => !open)}
          >
            {showEmbed
              ? music
                ? "Hide player"
                : "Hide calendar"
              : music
                ? "Play here"
                : "Schedule here"}
          </Button>
          {showEmbed ? (
            <iframe
              className={
                music ? "music-embed__frame" : "booking-embed__frame"
              }
              style={
                music
                  ? {
                      minHeight: musicEmbedHeight(music.id),
                    }
                  : undefined
              }
              src={embedSrc}
              title={`${link.title} ${music ? "player" : "scheduler"}`}
              loading="lazy"
              allow="encrypted-media; picture-in-picture; fullscreen"
              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            />
          ) : null}
        </div>
      ) : null}
    </div>
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
  // The card colour is the creator's, so the foreground has to be chosen
  // against it rather than fixed. White measured 2.28:1 on the mustard in use
  // -- readable ink takes the same card to 7.83:1.
  return (
    <Box
      className="perk-card"
      style={{
        background: referral.color,
        color: readableForeground(referral.color),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" sx={{ opacity: 0.88, letterSpacing: "0.08em" }}>
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
  themeConfig,
  products = [],
  mediaEmbeds = [],
  faqs = [],
  highlights = [],
  disclosureText,
  eventTag,
  showSaveContact = false,
  showExchange = false,
}: {
  profile: CreatorProfile;
  template?: string;
  databaseProfileId?: string;
  published?: boolean;
  showBadge?: boolean;
  themeConfig?: unknown;
  products?: PublicProduct[];
  mediaEmbeds?: PublicMediaEmbed[];
  faqs?: PublicFaq[];
  highlights?: PublicHighlight[];
  disclosureText?: string | null;
  eventTag?: string | null;
  showSaveContact?: boolean;
  showExchange?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [publicView, setPublicView] = useState<"links" | "shop">("links");
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

  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  // Generated on first open rather than on mount: most visitors never ask for
  // it, and the page URL is only knowable client-side anyway.
  useEffect(() => {
    if (!qrOpen || qrDataUrl) return;
    let active = true;
    QRCode.toDataURL(window.location.href, {
      width: 720,
      margin: 1,
      // Fixed high-contrast ink on paper, not the page theme -- a themed code
      // on a low-contrast pair is the standard way to make one unscannable.
      color: { dark: "#17180f", light: "#fffef8" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setNotice({ message: "The QR code could not be generated", severity: "error" });
      });
    return () => {
      active = false;
    };
  }, [qrOpen, qrDataUrl]);

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
      products: products.filter((item) =>
        searchable([
          item.title,
          item.description,
          item.category,
          item.badge,
        ]).includes(needle),
      ),
      faqs: faqs.filter((item) =>
        searchable([item.question, item.answer]).includes(needle),
      ),
    };
  }, [faqs, products, profile, query]);

  const track = useCallback((label: string, target?: TrackTarget) => {
    setNotice({ message: label, severity: "info" });
    if (databaseProfileId && target) {
      const supabase = createClient();
      void supabase.from("click_events").insert({
        profile_id: databaseProfileId,
        event_type: target.eventType,
        link_id: target.linkId ?? null,
        referral_id: target.referralId ?? null,
        product_id: target.productId ?? null,
        media_embed_id: target.mediaEmbedId ?? null,
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

  const totalResults =
    filtered.links.length +
    filtered.referrals.length +
    filtered.products.length +
    filtered.faqs.length;
  const spotlightLinks = filtered.links.filter((link) => link.featured);
  const standardLinks = filtered.links.filter((link) => !link.featured);
  const customTheme = resolveProfileTheme(themeConfig, template);
  const brandingLogoUrl = publicAssetUrl(customTheme.logoPath);
  const wallpaperUrl = publicAssetUrl(customTheme.wallpaperPath);
  const coverUrl = template === "signal-deck" ? wallpaperUrl : null;
  const pageWallpaperUrl = template === "signal-deck" ? null : wallpaperUrl;
  const showContactForm = customTheme.contactForm === true;
  const videoProviders = new Set(["youtube", "vimeo", "twitch"]);
  const videoEmbeds = mediaEmbeds.filter((item) =>
    videoProviders.has(item.provider),
  );
  const audioEmbeds = mediaEmbeds.filter(
    (item) => !videoProviders.has(item.provider),
  );
  const currentResultsCount =
    publicView === "shop"
      ? filtered.products.length
      : filtered.links.length +
        filtered.referrals.length +
        filtered.faqs.length +
        mediaEmbeds.length +
        (showContactForm ? 1 : 0);

  return (
    <main
      className={`app-shell public-template public-template--${template}${
        customTheme
          ? ` ${profileThemeClassName(customTheme, { wallpaperUrl: pageWallpaperUrl })}`
          : ""
      }`}
      style={
        customTheme
          ? (profileThemeStyle(customTheme, {
              wallpaperUrl: pageWallpaperUrl,
            }) as React.CSSProperties)
          : undefined
      }
    >
      {template === "signal-deck" ? (
        <Box
          className={`profile-cover profile-cover--bleed${coverUrl ? "" : " profile-cover--fallback"}`}
          style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
          aria-hidden="true"
        />
      ) : null}
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
              <Tooltip title="Show QR code" arrow>
                <IconButton
                  size="small"
                  onClick={() => setQrOpen(true)}
                  aria-label="Show QR code for this page"
                >
                  <QrCode2Rounded fontSize="small" />
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
            {brandingLogoUrl && (
              <Box
                component="img"
                className="profile-brand-logo"
                src={brandingLogoUrl}
                alt={`${profile.displayName} logo`}
              />
            )}
            {template !== "signal-deck" && coverUrl ? (
              <Box
                className="profile-cover"
                style={{ backgroundImage: `url("${coverUrl}")` }}
                aria-hidden="true"
              />
            ) : null}
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
            {(profile.tags?.length ?? 0) > 0 && (
              <ul className="profile-tags" aria-label="Skills and topics">
                {profile.tags!.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
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

        {(showSaveContact || showExchange) && (
          <ContactExchange
            profileId={databaseProfileId}
            username={profile.username}
            displayName={profile.displayName}
            eventTag={eventTag}
            allowSaveContact={showSaveContact}
            allowExchange={showExchange}
          />
        )}

        <section className="hub-panel">
          {highlights.length > 0 && (
            <section
              className="profile-highlights"
              aria-labelledby="profile-highlights-heading"
            >
              <div className="section-heading">
                <Typography
                  id="profile-highlights-heading"
                  component="h2"
                  className="section-label"
                >
                  Right now
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  24-hour highlights
                </Typography>
              </div>
              <div className="profile-highlights__rail">
                {highlights.map((highlight) => {
                  const content = (
                    <>
                      <Box
                        component="img"
                        src={publicAssetUrl(highlight.image_path)}
                        alt=""
                      />
                      <span>{highlight.title || "Update"}</span>
                    </>
                  );
                  return highlight.destination_url ? (
                    <Box
                      component="a"
                      href={highlight.destination_url}
                      target="_blank"
                      rel="noreferrer"
                      className="profile-highlight"
                      key={highlight.id}
                    >
                      {content}
                    </Box>
                  ) : (
                    <div className="profile-highlight" key={highlight.id}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          <div className="profile-search">
            <TextField
              className="search-field"
              placeholder="Search this page…"
              type="search"
              size="small"
              fullWidth
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              inputProps={{
                "aria-label": "Search this page",
              }}
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

          {products.length > 0 && (
            <div className="profile-view-toggle" role="tablist" aria-label="Page view">
              <Button
                role="tab"
                aria-selected={publicView === "links"}
                className={publicView === "links" ? "is-active" : ""}
                onClick={() => setPublicView("links")}
              >
                Links
              </Button>
              <Button
                role="tab"
                aria-selected={publicView === "shop"}
                className={publicView === "shop" ? "is-active" : ""}
                onClick={() => setPublicView("shop")}
              >
                Shop
              </Button>
            </div>
          )}

          {publicView === "links" ? (
            <>
              {videoEmbeds.length > 0 && (
                <section className="content-section" aria-labelledby="video-heading">
                  <div className="section-heading">
                    <Typography
                      id="video-heading"
                      component="h2"
                      className="section-label"
                    >
                      Watch
                    </Typography>
                    <PlayCircleOutlineRounded fontSize="small" />
                  </div>
                  <div className="media-embed-list media-embed-list--video">
                    {videoEmbeds.map((item) => {
                      const playerUrl =
                        item.layout === "compact"
                          ? null
                          : mediaPlayerUrl({ ...item, layout: "player" });
                      const height = musicEmbedHeight(
                        item.provider as Parameters<typeof musicEmbedHeight>[0],
                        "player",
                      );
                      return (
                        <article
                          className="media-embed-card media-embed-card--video"
                          key={item.id}
                        >
                          {playerUrl && (
                            <iframe
                              src={playerUrl}
                              title={item.title}
                              loading="lazy"
                              allow="encrypted-media; picture-in-picture; fullscreen"
                              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                              style={{ minHeight: height }}
                            />
                          )}
                          <div>
                            <span>
                              <PlayCircleOutlineRounded />
                              {musicProviderLabel(item.provider)}
                            </span>
                            <Typography variant="h3">{item.title}</Typography>
                            <Button
                              component="a"
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              endIcon={<ArrowOutwardRounded />}
                              onClick={() =>
                                track(`Opened ${item.title}`, {
                                  eventType: "media_open",
                                  mediaEmbedId: item.id,
                                })
                              }
                            >
                              Open
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {audioEmbeds.length > 0 && (
                <section className="content-section" aria-labelledby="media-heading">
                  <div className="section-heading">
                    <Typography
                      id="media-heading"
                      component="h2"
                      className="section-label"
                    >
                      Listen
                    </Typography>
                    <MusicNoteRounded fontSize="small" />
                  </div>
                  <div className="media-embed-list">
                    {audioEmbeds.map((item) => {
                      const playerUrl =
                        item.layout === "player" ? mediaPlayerUrl(item) : null;
                      const height = musicEmbedHeight(
                        item.provider as Parameters<typeof musicEmbedHeight>[0],
                        item.layout,
                      );
                      return (
                        <article className="media-embed-card" key={item.id}>
                          {playerUrl && (
                            <iframe
                              src={playerUrl}
                              title={item.title}
                              loading="lazy"
                              allow="encrypted-media; picture-in-picture; fullscreen"
                              sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                              style={{ minHeight: height }}
                            />
                          )}
                          <div>
                            <span>
                              <MusicNoteRounded />
                              {musicProviderLabel(item.provider)}
                            </span>
                            <Typography variant="h3">{item.title}</Typography>
                            <Button
                              component="a"
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              endIcon={<ArrowOutwardRounded />}
                              onClick={() =>
                                track(`Opened ${item.title}`, {
                                  eventType: "media_open",
                                  mediaEmbedId: item.id,
                                })
                              }
                            >
                              Open
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {filtered.referrals.length > 0 && (
                <section
                  className="content-section content-section--perks"
                  aria-labelledby="pocket-perks"
                >
                  <div className="section-heading">
                    <Typography
                      id="pocket-perks"
                      component="h2"
                      className="section-label"
                    >
                      Perks & referrals
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Swipe →
                    </Typography>
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
                    <Typography
                      id="featured-links"
                      component="h2"
                      className="section-label"
                    >
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
                    <Typography
                      id="all-links"
                      component="h2"
                      className="section-label"
                    >
                      My links
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {query
                        ? `${totalResults} results`
                        : `${standardLinks.length} destinations`}
                    </Typography>
                  </div>
                  <div className="link-list">
                    {standardLinks.map((link) => (
                      <LinkCard key={link.id} link={link} onOpen={track} />
                    ))}
                  </div>
                </section>
              )}

              {showContactForm && (
                <section
                  className="content-section"
                  aria-labelledby="contact-heading"
                >
                  <div className="section-heading">
                    <Typography
                      id="contact-heading"
                      component="h2"
                      className="section-label"
                    >
                      Forms
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Get in touch
                    </Typography>
                  </div>
                  <ProfileContactForm
                    profileId={databaseProfileId}
                    displayName={profile.displayName}
                  />
                </section>
              )}

              {filtered.faqs.length > 0 && (
                <section
                  className="content-section profile-faq"
                  aria-labelledby="profile-faq-heading"
                >
                  <div className="section-heading">
                    <Typography
                      id="profile-faq-heading"
                      component="h2"
                      className="section-label"
                    >
                      Good to know
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {filtered.faqs.length}{" "}
                      {filtered.faqs.length === 1 ? "answer" : "answers"}
                    </Typography>
                  </div>
                  <div className="profile-faq__list">
                    {filtered.faqs.map((faq) => (
                      <details key={faq.id}>
                        <summary>
                          <span>{faq.question}</span>
                          <i aria-hidden="true">+</i>
                        </summary>
                        <Typography component="div" variant="body2">
                          {faq.answer}
                        </Typography>
                      </details>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="content-section" aria-labelledby="shop-heading">
              <div className="section-heading">
                <Typography id="shop-heading" component="h2" className="section-label">
                  Shop
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Checkout opens on the seller’s site
                </Typography>
              </div>
              <div className="product-grid">
                {filtered.products.map((item) => (
                  <article
                    className={`product-card${item.is_featured ? " product-card--featured" : ""}`}
                    key={item.id}
                  >
                    <div className="product-card__media">
                      {item.image_path ? (
                        <Box
                          component="img"
                          src={publicAssetUrl(item.image_path)}
                          alt={`${item.title} preview`}
                          loading="lazy"
                        />
                      ) : (
                        <StorefrontOutlined />
                      )}
                      {item.badge && <Chip label={item.badge} size="small" />}
                    </div>
                    <div className="product-card__copy">
                      <span>{item.category}</span>
                      <Typography variant="h3">{item.title}</Typography>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                      <div>
                        <strong>{formatPrice(item) ?? "See details"}</strong>
                        <Button
                          component="a"
                          href={item.destination_url}
                          target="_blank"
                          rel="noreferrer"
                          variant="contained"
                          endIcon={<ArrowOutwardRounded />}
                          onClick={() =>
                            track(`Opened ${item.title}`, {
                              eventType: "product_open",
                              productId: item.id,
                            })
                          }
                        >
                          {item.cta_label}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {currentResultsCount === 0 && (
            <Box className="empty-state">
              <Typography variant="h3">Nothing matches yet.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ my: 1.5 }}>
                Try another keyword or clear the search to see everything.
              </Typography>
              <Button variant="contained" onClick={() => setQuery("")}>
                Clear search
              </Button>
            </Box>
          )}
        </section>
        {disclosureText && (
          <aside className="profile-disclosure" aria-label="Affiliate disclosure">
            <strong>Disclosure</strong>
            <span>{disclosureText}</span>
          </aside>
        )}
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

      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="profile-qr-heading"
      >
        <DialogContent className="profile-qr">
          <Typography id="profile-qr-heading" component="h2">
            Scan to open this page
          </Typography>
          <div className="profile-qr__code">
            {qrDataUrl ? (
              <Box
                component="img"
                src={qrDataUrl}
                alt={`QR code linking to ${publicProfileAddress(profile.username)}`}
              />
            ) : (
              <span aria-label="Generating QR code" />
            )}
          </div>
          <p className="profile-qr__url">{publicProfileAddress(profile.username)}</p>
          <Stack direction="row" spacing={1} justifyContent="center">
            <Button size="small" startIcon={<ContentCopyRounded />} onClick={sharePage}>
              Copy link
            </Button>
            <Button
              size="small"
              component="a"
              href={qrDataUrl || undefined}
              download={`${profile.username}-qr.png`}
              startIcon={<QrCode2Rounded />}
              disabled={!qrDataUrl}
            >
              Save PNG
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

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
