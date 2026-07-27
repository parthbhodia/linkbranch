import { redirect } from "next/navigation";
import {
  Dashboard,
  type DashboardLink,
  type DashboardProfile,
  type DashboardReferral,
} from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard | Linkbranch",
  description: "Manage your Linkbranch profile.",
};

export const dynamic = "force-dynamic";

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
    { data: links },
    { data: referrals },
    { count: interactionCount },
  ] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("links")
        .select("id,title,subtitle,url,position,is_active,is_featured")
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("referrals")
        .select("id,provider,offer,url,code,color,position,is_active")
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("click_events")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id),
    ]);

  if (!profile) {
    redirect("/auth?error=profile_missing");
  }

  return (
    <Dashboard
      profile={profile as DashboardProfile}
      email={user.email ?? ""}
      links={(links ?? []) as DashboardLink[]}
      referrals={(referrals ?? []) as DashboardReferral[]}
      interactionCount={interactionCount ?? 0}
    />
  );
}
