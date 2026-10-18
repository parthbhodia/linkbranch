/** How a link is drawn on the public page. */
export type LinkCardStyle = "row" | "image";

export type LinkItem = {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  url: string;
  tags: string[];
  visits: number;
  color: string;
  featured?: boolean;
  thumbnailUrl?: string;
  /** Optional section heading; empty/absent keeps the flat list. */
  group?: string;
  /**
   * Per-link choice of shape. Absent is a row, the shape every link has always
   * had, so nothing that never asks changes.
   */
  cardStyle?: LinkCardStyle;
};

export type Referral = {
  id: string;
  provider: string;
  perk: string;
  code: string | null;
  url: string;
  tags: string[];
  color: string;
};

export type SocialLink = {
  platform: string;
  url: string;
};

export type CreatorProfile = {
  username: string;
  initials: string;
  /** Public URL of the uploaded avatar. Falls back to initials when absent. */
  avatarUrl?: string | null;
  displayName: string;
  headline: string;
  headlineAccent: string;
  eyebrow: string;
  /** Skill / topic chips shown under the intro (e.g. AWS, DevOps). */
  tags?: string[];
  bio: string;
  socials: SocialLink[];
  links: LinkItem[];
  referrals: Referral[];
};
