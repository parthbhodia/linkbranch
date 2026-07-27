import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing-home";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Cueful | One useful page for every click",
  description:
    "Build a free creator page for your links, referral offers, coupon codes, and audience insights.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Cueful | One page. Better clicks.",
    description:
      "Share links, referral offers, and coupon codes—then see what gets attention.",
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
