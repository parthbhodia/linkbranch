import { notFound } from "next/navigation";
import { ProfileHub } from "@/components/profile-hub";
import { exampleProfileBySlug } from "@/lib/example-profiles";
import { publicAssetUrl } from "@/lib/storage";
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
  const example = exampleProfileBySlug.get(username.toLowerCase());
  if (example) {
    return {
      title: `${example.profile.displayName} | Cueful example`,
      description: example.profile.bio,
      alternates: { canonical: `/u/${username.toLowerCase()}` },
      openGraph: {
        title: `${example.profile.displayName}'s creator profile`,
        description: example.profile.bio,
        url: `/u/${username.toLowerCase()}`,
        type: "profile" as const,
      },
    };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name,bio,seo_title,seo_description,seo_image_path,is_published",
    )
    .eq("username", username.toLowerCase())
    .eq("is_published", true)
    .maybeSingle();
  const title = profile?.seo_title || profile?.display_name || `@${username}`;
  const description =
    profile?.seo_description ||
    profile?.bio ||
    `Links, resources, and referral offers from @${username}.`;
  const socialImage = publicAssetUrl(profile?.seo_image_path);

  return {
    title,
    description,
    alternates: {
      canonical: `/u/${username.toLowerCase()}`,
    },
    openGraph: {
      title,
      description,
      url: `/u/${username.toLowerCase()}`,
      type: "profile" as const,
      images: socialImage ? [socialImage] : undefined,
    },
    twitter: {
      card: socialImage ? ("summary_large_image" as const) : ("summary" as const),
      title,
      description,
      images: socialImage ? [socialImage] : undefined,
    },
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
  const example = exampleProfileBySlug.get(username.toLowerCase());

  if (example) {
    return (
      <ProfileHub
        profile={example.profile}
        template={example.template}
      />
    );
  }

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
        .select(
          "id,title,subtitle,url,thumbnail_path,position,is_featured,starts_at,expires_at",
        )
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
    avatarUrl: publicAssetUrl(profile.avatar_path),
    socials: (socials ?? []).map((item) => ({
      platform: item.platform,
      url: item.url,
    })),
    links: (links ?? []).filter((item) => {
      // Server-rendered request time is the visibility cutoff for scheduled links.
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      return (
        (!item.starts_at || new Date(item.starts_at).getTime() <= now) &&
        (!item.expires_at || new Date(item.expires_at).getTime() > now)
      );
    }).map((item, index) => ({
      id: String(item.id),
      index: String(index + 1).padStart(2, "0"),
      title: item.title,
      subtitle: item.subtitle || "Shared from my Cueful",
      url: item.url,
      tags: [item.title, item.subtitle],
      visits: 0,
      color: linkColors[index % linkColors.length],
      featured: item.is_featured,
      thumbnailUrl: publicAssetUrl(item.thumbnail_path),
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
