import type { Metadata } from "next";
import { ProfileHub } from "@/components/profile-hub";
import { demoProfile } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Live profile demo | Cueful",
  description: "Explore an example Cueful creator profile.",
};

export default function DemoProfilePage() {
  return <ProfileHub profile={demoProfile} />;
}
