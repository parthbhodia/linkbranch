import type { Metadata } from "next";
import { InstallAfterHero } from "@/components/install-after-hero";
import { MarketingHome } from "@/components/marketing-home";
import { BRAND_NAME, BRAND_URL, DEFAULT_SOCIAL_IMAGE } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Free Link in Bio Tool for Creators | Cueful",
  description:
    "Build a customizable, ad-free link-in-bio page for Instagram, TikTok, YouTube, and every other platform.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Free Link in Bio Tool for Creators | Cueful",
    description:
      "Build a customizable, ad-free link-in-bio page for Instagram, TikTok, YouTube, and every other platform.",
    url: "/",
    siteName: BRAND_NAME,
    type: "website",
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: "Cueful — one free link for everything you create",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Link in Bio Tool for Creators | Cueful",
    description:
      "Build a customizable, ad-free link-in-bio page for Instagram, TikTok, YouTube, and every other platform.",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

export default function MarketingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BRAND_URL}/#organization`,
        name: BRAND_NAME,
        url: BRAND_URL,
      },
      {
        "@type": "WebSite",
        "@id": `${BRAND_URL}/#website`,
        name: BRAND_NAME,
        url: BRAND_URL,
        publisher: {
          "@id": `${BRAND_URL}/#organization`,
        },
      },
      {
        "@type": "SoftwareApplication",
        name: BRAND_NAME,
        url: BRAND_URL,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "A creator profile builder for links, referral offers, coupon codes, and audience analytics.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description: "Free to start",
        },
        featureList: [
          "Custom creator profiles",
          "Referral offer and coupon code cards",
          "Link open and code copy analytics",
          "Responsive profile templates",
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <MarketingHome />
      {/* The offer only ever existed on /card and the dashboard, both behind
          sign-in, so someone arriving at cueful.bio on a phone was never shown
          it -- and on iOS no browser raises one of its own, so our card is the
          only prompt there will be. Floating rather than inline keeps it off
          computers, where the browser's own install control already exists and
          a panel in the marketing flow would just be in the way. It renders
          nothing once installed, and a dismissal here lasts 30 days. */}
      <InstallAfterHero />
    </>
  );
}
