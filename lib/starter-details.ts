/**
 * Category-specific content offered during setup.
 *
 * Picking a purpose in the wizard used to prefill link titles and nothing else,
 * so a shop owner finished setup with "View our menu or catalog" and no way to
 * add what they actually sell, and a musician with no player. Both of those
 * live in their own tables (products, media_embeds) that the wizard never
 * touched -- reachable only from the dashboard, after setup, if you knew to
 * look.
 *
 * Examples here follow the same rule as the starter links: the label is filled
 * in, the URL is not. A prefilled URL would either be wrong or would publish a
 * placeholder product to a real page, and an incomplete row is dropped at save
 * rather than saved half-finished.
 */

import type { StarterPurpose } from "@/lib/starter-purposes";

export type StarterDetailKind = "shop" | "music" | null;

/** Which extra section, if any, a purpose unlocks. */
export function starterDetailKind(
  purpose: StarterPurpose | null,
): StarterDetailKind {
  switch (purpose) {
    case "local-shop":
    case "whatsapp-business":
    case "business-links":
    case "trades":
      return "shop";
    case "musician":
      return "music";
    default:
      return null;
  }
}

export type ShopItemExample = {
  title: string;
  description: string;
  /** One of the categories products_category_check allows. */
  category: "merch" | "service";
  ctaLabel: string;
};

/**
 * Deliberately generic. These are worded so a tyre shop, a bakery and a
 * plumber can all recognise the shape of their own offer in them, because the
 * wizard cannot know the trade -- and a wrong-sounding example is worse than a
 * plain one.
 */
export const SHOP_ITEM_EXAMPLES: Record<"shop" | "trade", ShopItemExample[]> = {
  shop: [
    {
      title: "Best seller",
      description: "The one people come in for. Say what it is and what it costs.",
      category: "merch",
      ctaLabel: "View details",
    },
    {
      title: "This month's offer",
      description: "A deal worth putting at the top of the page.",
      category: "merch",
      ctaLabel: "See the offer",
    },
    {
      title: "Popular service",
      description: "Something you do rather than sell. Fitting, repair, install.",
      category: "service",
      ctaLabel: "Book it",
    },
  ],
  trade: [
    {
      title: "Callout and diagnosis",
      description: "What a first visit covers, and the price for it.",
      category: "service",
      ctaLabel: "Request a quote",
    },
    {
      title: "Most-booked job",
      description: "The work you do most weeks. Say what it includes.",
      category: "service",
      ctaLabel: "Book it",
    },
    {
      title: "Emergency rate",
      description: "Out of hours, same day, or weekend pricing.",
      category: "service",
      ctaLabel: "Call now",
    },
  ],
};

export function shopItemExamples(purpose: StarterPurpose | null) {
  return purpose === "trades"
    ? SHOP_ITEM_EXAMPLES.trade
    : SHOP_ITEM_EXAMPLES.shop;
}

export type MusicExample = {
  title: string;
  /** Must match media_embeds_provider_check. */
  provider: "spotify" | "apple_music" | "youtube" | "soundcloud" | "bandcamp";
};

export const MUSIC_EXAMPLE: MusicExample = {
  title: "Latest release",
  provider: "spotify",
};
