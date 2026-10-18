import { Suspense } from "react";
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
import { DashboardSkeleton } from "@/components/dashboard-skeleton";
import {
  type DashboardMediaEmbed,
  type DashboardProduct,
} from "@/components/commerce-media-editor";
import { type DashboardConnection } from "@/components/connections-inbox";
import { type DashboardFaq } from "@/components/faq-editor";
import { type DashboardHighlight } from "@/components/highlights-editor";
import { isAdminEmail } from "@/lib/admin-access";
import { createClient } from "@/lib/supabase/server";
import type { TimelineEntry } from "@/lib/timeline";

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

  // Auth and the profile row resolve before anything streams. Behind the
  // Suspense boundary below, both redirects would land after the response had
  // already begun -- answered 200 and completed only once React hydrates.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth?error=profile_missing");
  }

  // Fetched here rather than in the workspace so a missing table (before the
  // alias migration lands) cannot fail the dashboard's data block.
  const { data: aliases } = await supabase
    .from("profile_aliases")
    .select("alias")
    .eq("user_id", user.id)
    .order("alias");

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardWorkspace
        profile={profile as DashboardProfile}
        email={user.email ?? ""}
        isAdmin={isAdminEmail(user.email)}
        aliases={(aliases ?? []).map((item) => item.alias)}
      />
    </Suspense>
  );
}

async function DashboardWorkspace({
  profile,
  email,
  isAdmin,
  aliases,
}: {
  profile: DashboardProfile;
  email: string;
  isAdmin: boolean;
  aliases: string[];
}) {
  const supabase = await createClient();
  const [
    { data: links },
    { data: referrals },
    { data: socials },
    { data: events },
    { data: views },
    { data: timeline },
    { data: products },
    { data: mediaEmbeds },
    { data: faqs },
    { data: highlights },
    { data: connections },
    { count: referralCount },
  ] =
    await Promise.all([
      supabase
        .from("links")
        .select("id,title,subtitle,url,thumbnail_path,position,is_active,is_featured,group_name,card_style")
        .eq("user_id", profile.id)
        .order("position"),
      supabase
        .from("referrals")
        .select("id,provider,offer,url,code,color,position,is_active")
        .eq("user_id", profile.id)
        .order("position"),
      supabase
        .from("social_links")
        .select("platform,url,position")
        .eq("user_id", profile.id)
        .order("position"),
      supabase
        .from("click_events")
        .select(
          "event_type,link_id,referral_id,product_id,media_embed_id,occurred_at,device_type,country_code,referrer",
        )
        .eq("profile_id", profile.id)
        .order("occurred_at", { ascending: false })
        .limit(5000),
      supabase
        .from("profile_views")
        .select("occurred_at,device_type,country_code,referrer,event_tag,source")
        .eq("profile_id", profile.id)
        .order("occurred_at", { ascending: false })
        .limit(5000),
      supabase
        .from("profile_timeline")
        .select(
          "id,kind,title,organisation,location,started_on,ended_on,is_current,description",
        )
        .eq("user_id", profile.id)
        .order("position"),
      supabase
        .from("products")
        .select(
          "id,title,description,price_amount,currency,category,badge,image_path,destination_url,cta_label,position,is_active,is_featured",
        )
        .eq("user_id", profile.id)
        .order("position"),
      supabase
        .from("media_embeds")
        .select("id,title,provider,url,layout,position,is_active")
        .eq("user_id", profile.id)
        .order("position"),
      supabase
        .from("profile_faqs")
        .select("id,question,answer,position,is_active")
        .eq("user_id", profile.id)
        .order("position"),
      supabase
        .from("profile_highlights")
        .select("id,image_path,title,destination_url,position,expires_at")
        .eq("user_id", profile.id)
        .gt("expires_at", new Date().toISOString())
        .order("position"),
      supabase
        .from("connections")
        .select(
          "id,name,email,phone,company,job_title,note,event_tag,status,source,met_at,connected_at",
        )
        .eq("profile_id", profile.id)
        .order("met_at", { ascending: false })
        .limit(2000),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("referred_by", profile.id)
        .eq("is_published", true),
    ]);

  return (
    <Dashboard
      profile={profile}
      email={email}
      isAdmin={isAdmin}
      aliases={aliases}
      links={(links ?? []) as DashboardLink[]}
      referrals={(referrals ?? []) as DashboardReferral[]}
      socials={(socials ?? []) as DashboardSocial[]}
      events={(events ?? []) as DashboardEvent[]}
      views={(views ?? []) as DashboardView[]}
      products={(products ?? []) as DashboardProduct[]}
      timeline={(timeline ?? []) as TimelineEntry[]}
      mediaEmbeds={(mediaEmbeds ?? []) as DashboardMediaEmbed[]}
      faqs={(faqs ?? []) as DashboardFaq[]}
      highlights={(highlights ?? []) as DashboardHighlight[]}
      connections={(connections ?? []) as DashboardConnection[]}
      referralCount={referralCount ?? 0}
    />
  );
}
