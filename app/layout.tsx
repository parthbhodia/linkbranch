import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  applicationName: BRAND_NAME,
  title: "Cueful | One useful page for every click",
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
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Cueful | One page. Better clicks.",
    description:
      "Share links, referral offers, and coupon codes—then see what gets attention.",
    siteName: BRAND_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cueful | One page. Better clicks.",
    description:
      "Share links, referral offers, and coupon codes—then see what gets attention.",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
