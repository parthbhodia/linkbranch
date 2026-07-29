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
