import { redirect } from "next/navigation";
import { Dashboard, type DashboardProfile } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard | Linkbranch",
  description: "Manage your Linkbranch profile.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const [
    { data: profile },
    { count: linkCount },
    { count: referralCount },
    { count: interactionCount },
  ] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("links").select("id", { count: "exact", head: true }),
      supabase.from("referrals").select("id", { count: "exact", head: true }),
      supabase.from("click_events").select("id", { count: "exact", head: true }),
    ]);

  if (!profile) {
    redirect("/auth?error=profile_missing");
  }

  return (
    <Dashboard
      profile={profile as DashboardProfile}
      email={user.email ?? ""}
      linkCount={linkCount ?? 0}
      referralCount={referralCount ?? 0}
      interactionCount={interactionCount ?? 0}
    />
  );
}
