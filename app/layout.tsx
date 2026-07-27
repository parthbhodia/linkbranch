import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@/components/theme-provider";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND_URL),
  applicationName: BRAND_NAME,
  title: "Cueful | Creator links, referrals, and analytics",
  description:
    "Build a focused creator page for your links, referral offers, and audience insights.",
  openGraph: {
    title: "Cueful | Make every click useful",
    description:
      "Build a focused creator page for your links, referral offers, and audience insights.",
    siteName: BRAND_NAME,
    type: "website",
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
