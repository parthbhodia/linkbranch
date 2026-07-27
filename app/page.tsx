import { ProfileHub } from "@/components/profile-hub";
import { demoProfile } from "@/lib/demo-data";

export default function Home() {
  return <ProfileHub profile={demoProfile} />;
}
