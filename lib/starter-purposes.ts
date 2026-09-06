/**
 * The setup wizard's purpose ids.
 *
 * Only the ids live here: the pickable list carries MUI icons, so it stays in
 * the component. This exists so lib/starter-details.ts and
 * lib/starter-blueprints.ts can key off the same set without importing a
 * client component.
 */

/**
 * The runtime list, so a test can assert that every purpose has a blueprint --
 * a union alone cannot be enumerated, and a purpose added without one would
 * silently fall back to the generic creator page this file exists to avoid.
 */
export const STARTER_PURPOSES = [
  "sales",
  "realtor",
  "recruiter",
  "trades",
  "creator",
  "freelancer",
  "coach",
  "musician",
  "referral",
  "local-shop",
  "whatsapp-business",
  "business-links",
] as const;

export type StarterPurpose = (typeof STARTER_PURPOSES)[number];
