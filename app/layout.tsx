import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ServiceWorkerRegistrar } from "@/components/service-worker";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND_NAME, BRAND_URL, DEFAULT_SOCIAL_IMAGE } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  applicationName: BRAND_NAME,
  title: "Cueful — free link in bio for creators",
  description:
    "Build a free creator page for your links, referral offers, coupon codes, and audience insights.",
  keywords: [
    "link in bio",
    "creator profile",
    "referral link analytics",
    "creator analytics",
    "coupon code tracking",
  ],
  category: "technology",
  // public/apple-icon.png is a 180x180 built for exactly this and precached by
  // the service worker, but nothing ever linked to it: Next only emits an icon
  // link for the app/ file convention, and this file lives in public/. iOS
  // 16.4+ can fall back to the manifest icons; older iOS screenshots the page
  // and uses that. Declared here rather than moved so the URL stays stable and
  // the sw.js precache entry keeps matching.
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Standalone comes from the manifest on iOS 16.4+, which is every iPhone
  // this is likely to meet. These are for the ones before it, plus the home
  // screen label, which otherwise falls back to the full <title>.
  appleWebApp: {
    capable: true,
    title: "Cueful",
    // Not black-translucent: that draws the page under the status bar, and
    // every screen would then need a top safe-area inset it does not have.
    statusBarStyle: "default",
  },
  // Verifies a Search Console *URL-prefix* property (https://cueful.bio).
  // A Domain property still needs the equivalent DNS TXT record, since that
  // one covers www and every protocol and can only be proven at the zone.
  verification: {
    google: "melmRrR7HPqhynyB7vEYN35VjeAxem7OR_hmUBq_l5E",
  },
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Cueful — one link in bio for everything you share",
    description:
      "A free link-in-bio page for your links, shop, and referral codes — and the only one that shows you which codes people actually copy.",
    siteName: BRAND_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: "Cueful — one useful page for everything you share",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cueful — one link in bio for everything you share",
    description:
      "A free link-in-bio page for your links, shop, and referral codes — and the only one that shows you which codes people actually copy.",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// Matches manifest.background_color, so the browser and app chrome do not flash
// a different colour against the page while it loads.
export const viewport: Viewport = {
  themeColor: "#faf9f1",
};

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Next emits only the modern mobile-web-app-capable, which iOS before
            16.4 ignores. Those versions read this spelling and nothing else,
            and 16.4 onwards takes standalone from the manifest, so carrying
            both covers every iPhone. Chrome logs a deprecation notice for this
            tag; that is the whole cost. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AppRouterCacheProvider>
        <Analytics />
        <ServiceWorkerRegistrar />
        {/* Absent unless NEXT_PUBLIC_GA_ID is set, so nothing is loaded in
            development or in previews that have no measurement id configured.
            Vercel Analytics above stays: it is cookieless, so it keeps
            reporting for visitors who decline consent. */}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
