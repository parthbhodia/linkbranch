import type { Metadata } from "next";
import { MarketingHome } from "@/components/marketing-home";

export const metadata: Metadata = {
  title: "Cueful | Links, referrals, and analytics for creators",
  description:
    "Build a focused creator page for your links, referral offers, and the insights that matter.",
};

export default function MarketingPage() {
  return <MarketingHome />;
}
