import { notFound } from "next/navigation";
import { ProfileHub } from "@/components/profile-hub";
import { createClient } from "@/lib/supabase/server";
import type { CreatorProfile } from "@/lib/types";

const linkColors = ["#c9ef69", "#ffb4d0", "#9ed6ff", "#ffd166"];

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return {
    title: `@${username} | Linkbranch`,
    description: `Links, resources, and referral offers from @${username}.`,
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const { username } = await params;
  const { published } = await searchParams;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) {
    notFound();
  }

  const [{ data: links }, { data: referrals }, { data: socials }] =
    await Promise.all([
      supabase
        .from("links")
        .select("id,title,subtitle,url,position,is_featured")
        .eq("user_id", profile.id)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("referrals")
        .select("id,provider,offer,url,code,color,position")
        .eq("user_id", profile.id)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("social_links")
        .select("platform,url,position")
        .eq("user_id", profile.id)
        .order("position"),
    ]);

  const initials =
    profile.display_name
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LB";

  const creatorProfile: CreatorProfile = {
    username: profile.username,
    initials,
    displayName: profile.display_name,
    greeting: profile.greeting,
    headline: profile.headline,
    headlineAccent: profile.headline_accent,
    eyebrow:
      profile.show_location && profile.location
        ? profile.location
        : `@${profile.username}`,
    bio: profile.bio,
    socials: (socials ?? []).map((item) => ({
      platform: item.platform,
      url: item.url,
    })),
    links: (links ?? []).map((item, index) => ({
      id: String(item.id),
      index: String(index + 1).padStart(2, "0"),
      title: item.title,
      subtitle: item.subtitle || "Shared from my Linkbranch",
      url: item.url,
      tags: [item.title, item.subtitle],
      visits: 0,
      color: linkColors[index % linkColors.length],
      featured: item.is_featured,
    })),
    referrals: (referrals ?? []).map((item) => ({
      id: String(item.id),
      provider: item.provider,
      perk: item.offer,
      code: item.code,
      url: item.url,
      tags: [item.provider, item.offer, item.code ?? ""],
      color: item.color,
    })),
  };

  return (
    <ProfileHub
      profile={creatorProfile}
      template={profile.template}
      databaseProfileId={profile.id}
      published={published === "1"}
    />
  );
}
