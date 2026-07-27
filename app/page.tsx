import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing-home";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Cueful | Links, referrals, and analytics for creators",
  description:
    "Build a focused creator page for your links, referral offers, and the insights that matter.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Cueful | Make every click useful",
    description:
      "Build a focused creator page for links, referral offers, and the audience signals that matter.",
    url: "/",
    siteName: BRAND_NAME,
    type: "website",
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
    </>
  );
}
