import AlbumRounded from "@mui/icons-material/AlbumRounded";
import HeadphonesRounded from "@mui/icons-material/HeadphonesRounded";
import LibraryMusicRounded from "@mui/icons-material/LibraryMusicRounded";
import MusicNoteRounded from "@mui/icons-material/MusicNoteRounded";
import PodcastsRounded from "@mui/icons-material/PodcastsRounded";
import VideocamRounded from "@mui/icons-material/VideocamRounded";
import type { ReactNode } from "react";
import { BRAND_DOMAIN } from "@/lib/brand";

export type MusicProviderId =
  | "spotify"
  | "apple_music"
  | "soundcloud"
  | "youtube"
  | "bandcamp"
  | "twitch"
  | "vimeo"
  | "audiomack";

export type MusicProvider = {
  id: MusicProviderId;
  label: string;
  title: string;
  subtitle: string;
  placeholder: string;
  hostPatterns: string[];
  icon: ReactNode;
  embeddable: boolean;
  kind: "music" | "video" | "podcast";
};

export const musicProviders: MusicProvider[] = [
  {
    id: "spotify",
    label: "Spotify",
    title: "Listen on Spotify",
    subtitle: "Play a preview on your page",
    placeholder: "https://open.spotify.com/track/…",
    hostPatterns: ["open.spotify.com", "spotify.com", "spotify.link"],
    icon: <LibraryMusicRounded fontSize="small" />,
    embeddable: true,
    kind: "music",
  },
  {
    id: "apple_music",
    label: "Apple Music",
    title: "Listen on Apple Music",
    subtitle: "Embed your Apple Music release",
    placeholder: "https://music.apple.com/us/album/…",
    hostPatterns: ["music.apple.com", "itunes.apple.com"],
    icon: <HeadphonesRounded fontSize="small" />,
    embeddable: true,
    kind: "music",
  },
  {
    id: "soundcloud",
    label: "SoundCloud",
    title: "Play on SoundCloud",
    subtitle: "Inline SoundCloud player",
    placeholder: "https://soundcloud.com/artist/track",
    hostPatterns: ["soundcloud.com", "on.soundcloud.com"],
    icon: <PodcastsRounded fontSize="small" />,
    embeddable: true,
    kind: "music",
  },
  {
    id: "youtube",
    label: "YouTube",
    title: "Watch on YouTube",
    subtitle: "Embed a video or music video",
    placeholder: "https://www.youtube.com/watch?v=…",
    hostPatterns: ["youtube.com", "youtu.be", "music.youtube.com", "m.youtube.com"],
    icon: <VideocamRounded fontSize="small" />,
    embeddable: true,
    kind: "video",
  },
  {
    id: "bandcamp",
    label: "Bandcamp",
    title: "Support on Bandcamp",
    subtitle: "Bandcamp album or track",
    placeholder: "https://artist.bandcamp.com/album/…",
    hostPatterns: ["bandcamp.com"],
    icon: <AlbumRounded fontSize="small" />,
    embeddable: true,
    kind: "music",
  },
  {
    id: "audiomack",
    label: "Audiomack",
    title: "Listen on Audiomack",
    subtitle: "Audiomack song or album",
    placeholder: "https://audiomack.com/artist/song/…",
    hostPatterns: ["audiomack.com"],
    icon: <MusicNoteRounded fontSize="small" />,
    embeddable: true,
    kind: "music",
  },
  {
    id: "twitch",
    label: "Twitch",
    title: "Watch on Twitch",
    subtitle: "Channel or VOD embed",
    placeholder: "https://www.twitch.tv/your-channel",
    hostPatterns: ["twitch.tv"],
    icon: <VideocamRounded fontSize="small" />,
    embeddable: true,
    kind: "video",
  },
  {
    id: "vimeo",
    label: "Vimeo",
    title: "Watch on Vimeo",
    subtitle: "Inline Vimeo player",
    placeholder: "https://vimeo.com/123456789",
    hostPatterns: ["vimeo.com", "player.vimeo.com"],
    icon: <VideocamRounded fontSize="small" />,
    embeddable: true,
    kind: "video",
  },
];

/** Quick-add chips shown in editors (music-first, Sociials/Linktree style). */
export const musicQuickAdds = musicProviders.filter((provider) =>
  ["spotify", "apple_music", "soundcloud", "youtube", "bandcamp", "audiomack"].includes(
    provider.id,
  ),
);

export function detectMusicProvider(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return (
      musicProviders.find((provider) =>
        provider.hostPatterns.some((pattern) => {
          if (pattern === "bandcamp.com") {
            return host === pattern || host.endsWith(`.${pattern}`);
          }
          return host === pattern || host.endsWith(`.${pattern}`);
        }),
      ) ?? null
    );
  } catch {
    return null;
  }
}

export function isLikelyCompleteMusicUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const segments = parsed.pathname
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean)
      .filter((segment) => segment !== "intl-us" && !segment.startsWith("intl-"));

    if (segments.some((segment) => segment.includes("…") || segment === "your-channel")) {
      return false;
    }

    if (host.includes("spotify.com") || host === "spotify.link") {
      return segments.length >= 2;
    }
    if (host.includes("music.apple.com") || host.includes("itunes.apple.com")) {
      return segments.length >= 3;
    }
    if (host.includes("soundcloud.com")) {
      return segments.length >= 2;
    }
    if (host.includes("audiomack.com")) {
      return segments.length >= 3;
    }
    if (host.endsWith("bandcamp.com")) {
      return segments.length >= 2;
    }
    if (host.includes("youtube.com") || host === "youtu.be" || host.includes("music.youtube.com")) {
      return Boolean(
        parsed.searchParams.get("v") ||
          host === "youtu.be" ||
          /\/(?:shorts|embed|live)\//.test(parsed.pathname),
      );
    }
    if (host.includes("vimeo.com")) {
      return segments.length >= 1 && /^\d+$/.test(segments[segments.length - 1] ?? "");
    }
    if (host.includes("twitch.tv")) {
      return segments.length >= 1;
    }
    return segments.length >= 1;
  } catch {
    return false;
  }
}

function youtubeVideoId(url: URL) {
  if (url.hostname === "youtu.be") {
    return url.pathname.slice(1).split("/")[0] || null;
  }
  return (
    url.searchParams.get("v") ??
    url.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] ??
    null
  );
}

export function musicPlayerUrl(
  url: string,
  providerId: MusicProviderId,
  options?: { parentHost?: string },
) {
  try {
    const parsed = new URL(url);
    if (providerId === "spotify") {
      const path = parsed.pathname.replace(/^\/embed\//, "/").replace(/^\/intl-[^/]+/, "");
      return `https://open.spotify.com/embed${path}${parsed.search}`;
    }
    if (providerId === "apple_music") {
      return `https://embed.music.apple.com${parsed.pathname}${parsed.search}`;
    }
    if (providerId === "soundcloud") {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&hide_related=true&show_comments=false&visual=false`;
    }
    if (providerId === "youtube") {
      const id = youtubeVideoId(parsed);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (providerId === "vimeo") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (providerId === "bandcamp") {
      return `https://bandcamp.com/EmbeddedPlayer/size=large/bgcol=333333/linkcol=0f91ff/tracklist=false/artwork=small/transparent=true/?url=${encodeURIComponent(url)}`;
    }
    if (providerId === "audiomack") {
      const path = parsed.pathname.replace(/^\/embed\//, "/");
      if (path.includes("/song/")) {
        return `https://audiomack.com/embed${path}`;
      }
      if (path.includes("/album/")) {
        return `https://audiomack.com/embed${path}`;
      }
      return `https://audiomack.com/embed${path}`;
    }
    if (providerId === "twitch") {
      const parent = options?.parentHost || BRAND_DOMAIN;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "videos" && parts[1]) {
        return `https://player.twitch.tv/?video=${parts[1]}&parent=${parent}&autoplay=false`;
      }
      if (parts[0] === "clip" || parts[0] === "clips") {
        const slug = parts[0] === "clips" ? parts[2] : parts[1];
        return slug
          ? `https://clips.twitch.tv/embed?clip=${slug}&parent=${parent}&autoplay=false`
          : null;
      }
      const channel = parts[0];
      return channel
        ? `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=false`
        : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function musicEmbedHeight(providerId: MusicProviderId, layout = "player") {
  if (layout === "compact") return 80;
  if (providerId === "spotify") return 152;
  if (providerId === "apple_music") return 175;
  if (providerId === "soundcloud") return 166;
  if (providerId === "audiomack") return 252;
  if (providerId === "bandcamp") return 120;
  if (providerId === "youtube" || providerId === "vimeo" || providerId === "twitch") {
    return 280;
  }
  return 152;
}

export function musicProviderLabel(providerId: string) {
  return (
    musicProviders.find((item) => item.id === providerId)?.label ??
    providerId.replace(/_/g, " ")
  );
}
