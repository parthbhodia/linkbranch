/**
 * The setup wizard's purpose ids.
 *
 * Only the type lives here: the list itself carries MUI icons, so it stays in
 * the component. This exists so lib/starter-details.ts can key off the same
 * union without importing a client component.
 */
export type StarterPurpose =
  | "sales"
  | "realtor"
  | "recruiter"
  | "trades"
  | "creator"
  | "freelancer"
  | "coach"
  | "musician"
  | "referral"
  | "local-shop"
  | "whatsapp-business"
  | "business-links";
