import type { Metadata } from "next";
import { ProfileHub } from "@/components/profile-hub";
import { demoProfile } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Live profile demo | Linkbranch",
  description: "Explore an example Linkbranch creator profile.",
};

export default function DemoProfilePage() {
  return <ProfileHub profile={demoProfile} />;
}
