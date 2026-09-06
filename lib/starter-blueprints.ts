/**
 * What each kind of page needs from setup.
 *
 * Picking a purpose used to rewrite the link titles and nothing else. So a
 * tyre shop was greeted with "Hey, I'm pbhodia · I make useful things", asked
 * whether it wanted a Bandcamp link, and had to scroll past nineteen helper
 * buttons and every link row before reaching the section where it says what it
 * sells. The page was ordered for a creator and relabelled for everyone else.
 *
 * This is the per-purpose answer: the voice, the opening line, which helper
 * rails are worth showing, and what leads the step. Everything here is a
 * starting point the creator edits, in the same spirit as the starter link
 * titles -- wording filled in, destinations left blank.
 */

import type { StarterPurpose } from "@/lib/starter-purposes";

/**
 * Which block leads the content step.
 *
 * For a shop the products are the page and the links are secondary, so
 * putting links first buries the thing they came to do.
 */
export type StarterLead = "links" | "products" | "music";

export type StarterRails = {
  /**
   * Music providers to offer, by id. Empty means no music rail at all: a
   * plumber has no use for Audiomack.
   */
  music: string[];
  /** Calendly and friends. */
  booking: boolean;
  /** WhatsApp, catalog, directions -- the local-business rail. */
  contact: boolean;
};

export type StarterBlueprint = {
  /**
   * A shop is a "this is", a person is a "hey, I'm". Getting this wrong makes
   * a business page read like someone's personal profile.
   */
  greeting: string;
  headline: string;
  headlineAccent: string;
  rails: StarterRails;
  lead: StarterLead;
  stepTitle: string;
  stepSubtitle: string;
};

const BUSINESS = "This is";
const PERSONAL = "Hey, I'm";

const NO_RAILS: StarterRails = { music: [], booking: false, contact: false };
const BOOKING: StarterRails = { ...NO_RAILS, booking: true };
const CONTACT: StarterRails = { ...NO_RAILS, contact: true };

const LINKS_STEP = {
  stepTitle: "Add your links",
  stepSubtitle: "Add the places you want visitors to go. You can reorder these later.",
};

export const STARTER_BLUEPRINTS: Record<StarterPurpose, StarterBlueprint> = {
  sales: {
    greeting: PERSONAL,
    headline: "Let's talk about what you",
    headlineAccent: "need.",
    rails: BOOKING,
    lead: "links",
    ...LINKS_STEP,
  },
  realtor: {
    greeting: PERSONAL,
    headline: "Homes, viewings, and",
    headlineAccent: "honest advice.",
    // Viewings are booked, and a listing without directions is half a listing.
    rails: { music: [], booking: true, contact: true },
    lead: "links",
    ...LINKS_STEP,
  },
  recruiter: {
    greeting: PERSONAL,
    headline: "Open roles and",
    headlineAccent: "quick chats.",
    rails: BOOKING,
    lead: "links",
    ...LINKS_STEP,
  },
  trades: {
    greeting: BUSINESS,
    headline: "Quotes, callouts,",
    headlineAccent: "and repairs.",
    rails: CONTACT,
    lead: "products",
    stepTitle: "What you do and where to find you",
    stepSubtitle:
      "Your jobs and prices come first — that is what people are checking. Links go underneath.",
  },
  creator: {
    greeting: PERSONAL,
    headline: "I make",
    headlineAccent: "useful things.",
    // Video and podcast, not the full music rack.
    rails: { music: ["youtube", "spotify"], booking: true, contact: false },
    lead: "links",
    ...LINKS_STEP,
  },
  freelancer: {
    greeting: PERSONAL,
    headline: "Available for",
    headlineAccent: "new work.",
    rails: BOOKING,
    lead: "links",
    ...LINKS_STEP,
  },
  coach: {
    greeting: PERSONAL,
    headline: "Let's work on",
    headlineAccent: "your goals.",
    rails: BOOKING,
    lead: "links",
    ...LINKS_STEP,
  },
  musician: {
    greeting: PERSONAL,
    headline: "New music and",
    headlineAccent: "live dates.",
    rails: {
      music: ["spotify", "apple_music", "soundcloud", "youtube", "bandcamp", "audiomack"],
      booking: false,
      contact: false,
    },
    lead: "music",
    stepTitle: "Your music and where to hear it",
    stepSubtitle:
      "The player goes on the page itself. Links to shows and merch go underneath.",
  },
  referral: {
    greeting: PERSONAL,
    headline: "The tools I",
    headlineAccent: "actually use.",
    rails: NO_RAILS,
    lead: "links",
    ...LINKS_STEP,
  },
  "local-shop": {
    greeting: BUSINESS,
    headline: "What we sell, and where to",
    headlineAccent: "find us.",
    rails: CONTACT,
    lead: "products",
    stepTitle: "What you sell and where to find you",
    stepSubtitle:
      "Start with what people come in for. Links and everything else go underneath.",
  },
  "whatsapp-business": {
    greeting: BUSINESS,
    headline: "Message us and we'll",
    headlineAccent: "sort it out.",
    rails: CONTACT,
    lead: "products",
    stepTitle: "What you sell and how to reach you",
    stepSubtitle:
      "Each item can open a WhatsApp chat with its name already typed. Links go underneath.",
  },
  "business-links": {
    greeting: BUSINESS,
    headline: "Everything you need,",
    headlineAccent: "one page.",
    rails: { music: [], booking: true, contact: true },
    lead: "products",
    stepTitle: "What you offer and where to find you",
    stepSubtitle:
      "Services and prices first, then the links that back them up.",
  },
};

export function starterBlueprint(purpose: StarterPurpose | null): StarterBlueprint | null {
  return purpose ? STARTER_BLUEPRINTS[purpose] : null;
}

/**
 * Local-business quick adds. Every one is an https destination, because
 * links_url_format rejects anything else -- which is why there is no "Call
 * now" here: a tel: link cannot be stored.
 */
export const CONTACT_QUICK_ADDS: Array<{ title: string; url: string; note: string }> = [
  {
    title: "Chat with us on WhatsApp",
    url: "https://wa.me/",
    note: "Add your number after wa.me/",
  },
  { title: "View our menu or catalog", url: "", note: "" },
  { title: "Get directions", url: "", note: "" },
  { title: "Opening hours", url: "", note: "" },
];

/** Shown to everyone, whatever the purpose. */
export const GENERAL_QUICK_ADDS: Array<{ title: string; url: string }> = [
  { title: "Visit our website", url: "" },
  { title: "Join my community", url: "" },
];
