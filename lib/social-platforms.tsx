import AlternateEmailRounded from "@mui/icons-material/AlternateEmailRounded";
import CloudOutlined from "@mui/icons-material/CloudOutlined";
import FacebookRounded from "@mui/icons-material/FacebookRounded";
import ForumRounded from "@mui/icons-material/ForumRounded";
import GitHub from "@mui/icons-material/GitHub";
import Instagram from "@mui/icons-material/Instagram";
import LanguageRounded from "@mui/icons-material/LanguageRounded";
import LinkedIn from "@mui/icons-material/LinkedIn";
import MusicNoteRounded from "@mui/icons-material/MusicNoteRounded";
import Pinterest from "@mui/icons-material/Pinterest";
import X from "@mui/icons-material/X";
import YouTube from "@mui/icons-material/YouTube";
import WhatsApp from "@mui/icons-material/WhatsApp";

export type SocialPlatformOption = {
  label: string;
  placeholder: string;
  icon: React.ReactNode;
};

/**
 * Official Partiful mark — the fluid ribbon “P” — traced from partiful.com and
 * drawn at 1em in currentColor to match the other brand icons.
 */
function PartifulIcon() {
  return (
    <svg
      viewBox="0 0 231 263"
      width="1em"
      height="1em"
      aria-hidden
      focusable="false"
      role="img"
    >
      <path
        fill="currentColor"
        d="M 39.596 221.932 C 26.66 221.932 17.764 212.126 17.822 198.539 C 18.014 149.087 106.228 139.734 106.228 106.862 C 106.228 75.886 27.026 99.106 27.286 63.549 C 27.401 47.739 53.792 43.313 75.249 43.313 C 119.106 43.313 166.752 62.279 166.752 100.848 C 166.752 122.98 147.815 148.587 116.269 148.587 C 111.22 148.587 107.43 147.952 101.121 147.952 C 35.489 147.952 75.249 221.932 39.587 221.932 L 39.597 221.932 Z M 52.215 259.548 C 81.558 259.548 104.593 232.363 104.593 206.439 C 104.593 190.946 94.639 182.796 94.639 171.73 C 94.639 162.251 100.63 158.768 105.997 158.768 C 112.624 158.768 122.261 165.658 138.351 165.658 C 176.534 165.658 230.807 135.942 230.807 85.672 C 230.807 31.93 168.955 0 110.267 0 C 61.987 0 7.656 19.602 7.656 53.744 C 7.656 90.416 73.586 91.359 73.586 119.497 C 73.585 149.53 0 153.004 0 205.169 C 0 233.624 23.794 259.548 52.196 259.548 Z"
      />
    </svg>
  );
}

export const socialPlatformOptions: SocialPlatformOption[] = [
  {
    label: "Instagram",
    placeholder: "https://instagram.com/username",
    icon: <Instagram />,
  },
  {
    label: "X / Twitter",
    placeholder: "https://x.com/username",
    icon: <X />,
  },
  {
    label: "TikTok",
    placeholder: "https://tiktok.com/@username",
    icon: <MusicNoteRounded />,
  },
  {
    label: "YouTube",
    placeholder: "https://youtube.com/@channel",
    icon: <YouTube />,
  },
  {
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
    icon: <LinkedIn />,
  },
  {
    label: "GitHub",
    placeholder: "https://github.com/username",
    icon: <GitHub />,
  },
  {
    label: "Threads",
    placeholder: "https://threads.net/@username",
    icon: <AlternateEmailRounded />,
  },
  {
    label: "Facebook",
    placeholder: "https://facebook.com/username",
    icon: <FacebookRounded />,
  },
  {
    label: "Pinterest",
    placeholder: "https://pinterest.com/username",
    icon: <Pinterest />,
  },
  {
    label: "Twitch",
    placeholder: "https://twitch.tv/username",
    icon: <ForumRounded />,
  },
  {
    label: "Discord",
    placeholder: "https://discord.gg/invite",
    icon: <ForumRounded />,
  },
  {
    label: "Bluesky",
    placeholder: "https://bsky.app/profile/username",
    icon: <CloudOutlined />,
  },
  {
    label: "Partiful",
    placeholder: "https://partiful.com/u/username",
    icon: <PartifulIcon />,
  },
  {
    label: "WhatsApp Business",
    placeholder: "https://wa.me/15551234567?text=Hello",
    icon: <WhatsApp />,
  },
  {
    label: "Website",
    placeholder: "https://yourwebsite.com",
    icon: <LanguageRounded />,
  },
];

export function getSocialPlatformOption(platform: string) {
  return socialPlatformOptions.find((option) => option.label === platform);
}

export function getSocialPlatformIcon(platform: string) {
  return getSocialPlatformOption(platform)?.icon ?? <LanguageRounded />;
}
