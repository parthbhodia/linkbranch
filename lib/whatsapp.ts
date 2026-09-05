/**
 * WhatsApp "click to chat" links for shop cards.
 *
 * A local shop has no checkout, and the way it actually takes orders is a
 * WhatsApp message. A product card whose button opens a chat with the item
 * already typed in is the nearest thing to a buy button such a shop can have,
 * and it fits the existing schema: products.destination_url only has to be an
 * https URL, and wa.me is one.
 */

/** E.164 allows up to 15 digits; anything under 8 is not a full number. */
const MIN_DIGITS = 8;
const MAX_DIGITS = 15;

/**
 * The international number as bare digits, or null. wa.me wants the country
 * code with no plus, spaces, dashes or leading zeros, and a trunk zero left in
 * ("0 98765 43210") silently produces a chat with nobody.
 */
export function normalizeWhatsAppNumber(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) return null;
  return digits;
}

export function buildWhatsAppUrl(number: string, message: string): string | null {
  const digits = normalizeWhatsAppNumber(number);
  if (!digits) return null;
  const text = message.trim();
  // encodeURIComponent rather than URLSearchParams: the latter writes spaces
  // as "+", which WhatsApp's own documentation avoids.
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}

const CHAT_HOSTS = new Set(["wa.me", "api.whatsapp.com", "web.whatsapp.com", "whatsapp.com", "www.whatsapp.com"]);

export function isWhatsAppUrl(value: string): boolean {
  return parseWhatsAppUrl(value) !== null;
}

/**
 * The number and prefilled message from any of WhatsApp's link forms, so an
 * existing card can be edited as "number + message" rather than as a URL.
 */
export function parseWhatsAppUrl(
  value: string,
): { number: string; message: string } | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !CHAT_HOSTS.has(url.hostname)) return null;

  const fromPath =
    url.hostname === "wa.me" ? url.pathname.replace(/^\/+/, "").split("/")[0] : "";
  const number = normalizeWhatsAppNumber(fromPath || url.searchParams.get("phone") || "");
  if (!number) return null;

  return { number, message: url.searchParams.get("text")?.trim() ?? "" };
}

/** Default first line of the chat, built from the item the visitor tapped. */
export function orderMessage(itemTitle: string): string {
  const title = itemTitle.trim();
  return title ? `Hi! I'd like to order: ${title}` : "Hi! I'd like to place an order.";
}
