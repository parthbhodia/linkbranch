import type { CreatorProfile } from "@/lib/types";

export type ExampleProfile = {
  slug: string;
  role: string;
  template: "field-notes" | "after-dark" | "soft-studio";
  profile: CreatorProfile;
};

export const exampleProfiles: ExampleProfile[] = [
  {
    slug: "maya-makes",
    role: "Creator",
    template: "soft-studio",
    profile: {
      username: "maya-makes",
      initials: "MM",
      displayName: "Maya",
      greeting: "Hi, I’m",
      headline: "I turn tiny ideas into",
      headlineAccent: "bright things.",
      eyebrow: "Illustrator · Video maker",
      bio: "Sketchbook tours, cheerful downloads, and the tools behind my weekly studio practice.",
      socials: [
        { platform: "Instagram", url: "https://instagram.com" },
        { platform: "YouTube", url: "https://youtube.com" },
        { platform: "TikTok", url: "https://tiktok.com" },
      ],
      links: [
        {
          id: "maya-1",
          index: "01",
          title: "Watch the latest studio diary",
          subtitle: "A quiet week of drawing, filming, and trying again.",
          url: "https://youtube.com",
          tags: ["video", "studio", "youtube"],
          visits: 0,
          color: "#ffb7d0",
          featured: true,
        },
        {
          id: "maya-2",
          index: "02",
          title: "Download my brush pack",
          subtitle: "Twelve textured brushes for playful lettering.",
          url: "https://gumroad.com",
          tags: ["brushes", "download", "shop"],
          visits: 0,
          color: "#d9c7ff",
        },
      ],
      referrals: [
        {
          id: "maya-ref",
          provider: "Skillshare",
          perk: "Try one month of creative classes",
          code: null,
          url: "https://skillshare.com",
          tags: ["classes", "creative"],
          color: "#7d45df",
        },
      ],
    },
  },
  {
    slug: "sam-builds",
    role: "Freelancer",
    template: "field-notes",
    profile: {
      username: "sam-builds",
      initials: "SB",
      displayName: "Sam",
      greeting: "Hey, I’m",
      headline: "I design calmer",
      headlineAccent: "products.",
      eyebrow: "Independent product designer",
      bio: "Selected launches, practical product notes, and a straightforward way to work together.",
      socials: [
        { platform: "LinkedIn", url: "https://linkedin.com" },
        { platform: "Dribbble", url: "https://dribbble.com" },
        { platform: "GitHub", url: "https://github.com" },
      ],
      links: [
        {
          id: "sam-1",
          index: "01",
          title: "Selected client work",
          subtitle: "Three launches, the decisions behind them, and what changed.",
          url: "https://dribbble.com",
          tags: ["portfolio", "client work", "case study"],
          visits: 0,
          color: "#c9ef69",
          featured: true,
        },
        {
          id: "sam-2",
          index: "02",
          title: "Book a 30-minute intro",
          subtitle: "For product design, audits, and focused advisory work.",
          url: "https://cal.com",
          tags: ["booking", "work", "consulting"],
          visits: 0,
          color: "#9ed6ff",
        },
      ],
      referrals: [
        {
          id: "sam-ref",
          provider: "Notion",
          perk: "The project handoff system I use with every client",
          code: "SAMBUILDS",
          url: "https://notion.so",
          tags: ["notion", "template", "workflow"],
          color: "#20221f",
        },
      ],
    },
  },
  {
    slug: "dani-deals",
    role: "Referral curator",
    template: "after-dark",
    profile: {
      username: "dani-deals",
      initials: "DD",
      displayName: "Dani",
      greeting: "I’m",
      headline: "I test the deal before I",
      headlineAccent: "share it.",
      eyebrow: "Travel · Tech · Worthwhile perks",
      bio: "A small, maintained list of offers I actually use—with expiry notes and no mystery links.",
      socials: [
        { platform: "Instagram", url: "https://instagram.com" },
        { platform: "Threads", url: "https://threads.net" },
        { platform: "YouTube", url: "https://youtube.com" },
      ],
      links: [
        {
          id: "dani-1",
          index: "01",
          title: "How I evaluate a referral offer",
          subtitle: "The five checks I make before anything lands here.",
          url: "https://medium.com",
          tags: ["guide", "trust", "referrals"],
          visits: 0,
          color: "#b9ff66",
          featured: true,
        },
      ],
      referrals: [
        {
          id: "dani-ref-1",
          provider: "Airalo",
          perk: "$3 off your first travel eSIM",
          code: "DANI3",
          url: "https://airalo.com",
          tags: ["travel", "esim", "coupon"],
          color: "#6d54d8",
        },
        {
          id: "dani-ref-2",
          provider: "Wise",
          perk: "Fee-free international transfer",
          code: null,
          url: "https://wise.com",
          tags: ["travel", "money", "transfer"],
          color: "#2e7d59",
        },
      ],
    },
  },
];

export const exampleProfileBySlug = new Map(
  exampleProfiles.map((example) => [example.slug, example]),
);
