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
  displayName: string;
  greeting: string;
  headline: string;
  headlineAccent: string;
  eyebrow: string;
  bio: string;
  socials: SocialLink[];
  links: LinkItem[];
  referrals: Referral[];
};
