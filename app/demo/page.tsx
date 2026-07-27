import type { Metadata } from "next";
import { ProfileHub } from "@/components/profile-hub";
import { demoProfile } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Live profile demo | Cueful",
  description: "Explore an example Cueful creator profile.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "Live creator profile demo | Cueful",
    description:
      "Explore a Cueful profile with links, referral offers, and useful audience signals.",
    url: "/demo",
    type: "website",
  },
};

export default function DemoProfilePage() {
  return <ProfileHub profile={demoProfile} />;
}
