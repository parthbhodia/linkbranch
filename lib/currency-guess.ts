/**
 * A sensible default currency for a shop item, from the browser's locale.
 *
 * The products table defaults currency to USD, so a shop that never sees a
 * currency field (the setup wizard, until now) publishes a tyre priced in
 * dollars. The region in the browser's locale is a good enough guess to make
 * the default right for most people; it is only ever a default.
 */

const REGION_CURRENCY: Record<string, string> = {
  US: "USD", IN: "INR", GB: "GBP", IE: "EUR", DE: "EUR", FR: "EUR", ES: "EUR",
  IT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", PT: "EUR", FI: "EUR", GR: "EUR",
  AU: "AUD", NZ: "NZD", CA: "CAD", AE: "AED", SA: "SAR", SG: "SGD", MY: "MYR",
  ID: "IDR", PH: "PHP", TH: "THB", VN: "VND", JP: "JPY", KR: "KRW", CN: "CNY",
  HK: "HKD", TW: "TWD", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", ZA: "ZAR",
  NG: "NGN", KE: "KES", GH: "GHS", EG: "EGP", MA: "MAD", TR: "TRY", IL: "ILS",
  BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", CH: "CHF",
  SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON",
  RU: "RUB", UA: "UAH",
};

export const FALLBACK_CURRENCY = "USD";

/** The choices offered in a select. Common first, then alphabetical. */
export const COMMON_CURRENCIES: string[] = [
  "USD", "INR", "EUR", "GBP",
  ...Array.from(new Set(Object.values(REGION_CURRENCY)))
    .filter((code) => !["USD", "INR", "EUR", "GBP"].includes(code))
    .sort(),
];

/**
 * ISO 4217 code for a BCP 47 locale such as "en-IN", or the fallback. A bare
 * language ("hi", "ta") is expanded to its likely region where the runtime
 * supports Intl.Locale.maximize.
 */
export function guessCurrency(locale: string | undefined | null): string {
  if (!locale) return FALLBACK_CURRENCY;
  let region: string | undefined = locale.split(/[-_]/)[1]?.toUpperCase();
  if (!region || region.length !== 2) {
    try {
      region = new Intl.Locale(locale).maximize().region ?? undefined;
    } catch {
      region = undefined;
    }
  }
  return (region && REGION_CURRENCY[region]) || FALLBACK_CURRENCY;
}

/** A code the products_currency_format check will accept. */
export function isCurrencyCode(value: string): boolean {
  return /^[A-Z]{3}$/.test(value);
}
