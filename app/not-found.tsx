import SearchOffRounded from "@mui/icons-material/SearchOffRounded";
import type { Metadata } from "next";
import { AuthStateCard } from "@/components/auth-state-card";

/**
 * The 404.
 *
 * There wasn't one, so every miss rendered Next's built-in default: unstyled,
 * no navigation, no way back into the product. That page is reached far more
 * often than a 404 normally would be, because proxy.ts reads any unclaimed
 * single segment as a handle -- so a typo in a handle someone was given, or a
 * page since taken down, lands here rather than anywhere recoverable.
 *
 * It also had no title the app set, which made it the third largest row in
 * Google Analytics with no name on it.
 *
 * Reuses AuthStateCard, so there is no new CSS and the frame it sits in
 * already carries the brand mark and an h1.
 */
export const metadata: Metadata = {
  title: "Page not found | Cueful",
  description:
    "That Cueful link does not point at a page. The handle may have changed, or the page may have been taken down.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <AuthStateCard
      icon={<SearchOffRounded />}
      eyebrow="PAGE NOT FOUND"
      title="Nothing lives at this link"
      // Leads with the handle because that is what the routing makes most
      // likely, without claiming it about every visitor who gets here.
      description="If you followed a cueful.bio link, the handle may have changed or the page may have been taken down. Handles are lowercase letters, numbers, hyphens and underscores, so a capital or a stray character is worth checking."
      primaryHref="/discover"
      primaryLabel="See pages worth opening"
      secondaryHref="/"
      secondaryLabel="Back to Cueful"
    />
  );
}
