import { redirect } from "next/navigation";
import {
  Dashboard,
  type DashboardLink,
  type DashboardEvent,
  type DashboardProfile,
  type DashboardReferral,
  type DashboardSocial,
  type DashboardView,
} from "@/components/dashboard";
import {
  type DashboardMediaEmbed,
  type DashboardProduct,
} from "@/components/commerce-media-editor";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Dashboard | Cueful",
  description: "Manage your Cueful profile.",
  robots: {
    index: false,
    follow: false,
  },
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
    { data: socials },
    { data: events },
    { data: views },
    { data: products },
    { data: mediaEmbeds },
    { count: referralCount },
  ] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("links")
        .select("id,title,subtitle,url,thumbnail_path,position,is_active,is_featured")
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("referrals")
        .select("id,provider,offer,url,code,color,position,is_active")
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("social_links")
        .select("platform,url,position")
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("click_events")
        .select(
          "event_type,link_id,referral_id,product_id,media_embed_id,occurred_at,device_type,country_code,referrer",
        )
        .eq("profile_id", user.id)
        .order("occurred_at", { ascending: false })
        .limit(5000),
      supabase
        .from("profile_views")
        .select("occurred_at,device_type,country_code,referrer")
        .eq("profile_id", user.id)
        .order("occurred_at", { ascending: false })
        .limit(5000),
      supabase
        .from("products")
        .select(
          "id,title,description,price_amount,currency,category,badge,image_path,destination_url,cta_label,position,is_active,is_featured",
        )
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("media_embeds")
        .select("id,title,provider,url,layout,position,is_active")
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", user.id)
        .eq("is_published", true),
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
      socials={(socials ?? []) as DashboardSocial[]}
      events={(events ?? []) as DashboardEvent[]}
      views={(views ?? []) as DashboardView[]}
      products={(products ?? []) as DashboardProduct[]}
      mediaEmbeds={(mediaEmbeds ?? []) as DashboardMediaEmbed[]}
      referralCount={referralCount ?? 0}
    />
  );
}
