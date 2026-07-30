import { notFound } from "next/navigation";
import {
  ProfileHub,
  type PublicMediaEmbed,
  type PublicProduct,
  type PublicFaq,
  type PublicHighlight,
} from "@/components/profile-hub";
import { DEFAULT_SOCIAL_IMAGE, publicProfilePath, publicProfileUrl } from "@/lib/brand";
import { exampleProfileBySlug } from "@/lib/example-profiles";
import { publicAssetUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { defaultProfileTheme } from "@/lib/theme-config";
import type { CreatorProfile } from "@/lib/types";

const linkColors = ["#c9ef69", "#ffb4d0", "#9ed6ff", "#ffd166"];

export const dynamic = "force-dynamic";

function profileStructuredData({
  profile,
  canonicalUrl,
  createdAt,
  updatedAt,
}: {
  profile: CreatorProfile;
  canonicalUrl: string;
  createdAt?: string;
  updatedAt?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${canonicalUrl}#profile`,
    url: canonicalUrl,
    ...(createdAt ? { dateCreated: createdAt } : {}),
    ...(updatedAt ? { dateModified: updatedAt } : {}),
    mainEntity: {
      "@type": "Person",
      "@id": `${canonicalUrl}#creator`,
      name: profile.displayName,
      alternateName: `@${profile.username}`,
      identifier: profile.username,
      description: profile.bio,
      ...(profile.avatarUrl ? { image: profile.avatarUrl } : {}),
      sameAs: profile.socials.map((social) => social.url),
    },
  };
}

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
      alternates: { canonical: publicProfilePath(username) },
      openGraph: {
        title: `${example.profile.displayName}'s creator profile`,
        description: example.profile.bio,
        url: publicProfilePath(username),
        type: "profile" as const,
        images: [DEFAULT_SOCIAL_IMAGE],
      },
      twitter: {
        card: "summary_large_image" as const,
        title: `${example.profile.displayName}'s creator profile`,
        description: example.profile.bio,
        images: [DEFAULT_SOCIAL_IMAGE],
      },
    };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name,bio,seo_title,seo_description,seo_image_path,favicon_path,seo_og_title,seo_og_description,seo_keywords,seo_noindex,twitter_card_style,canonical_url,is_published",
    )
    .eq("username", username.toLowerCase())
    .eq("is_published", true)
    .maybeSingle();
  const title = profile?.seo_title || profile?.display_name || `@${username}`;
  const description =
    profile?.seo_description ||
    profile?.bio ||
    `Links, resources, and referral offers from @${username}.`;
  const ogTitle = profile?.seo_og_title || title;
  const ogDescription = profile?.seo_og_description || description;
  const socialImage = publicAssetUrl(profile?.seo_image_path) ?? DEFAULT_SOCIAL_IMAGE;
  const favicon = publicAssetUrl(profile?.favicon_path);
  const canonical =
    profile?.canonical_url?.trim() || publicProfilePath(username);
  const twitterCard =
    profile?.twitter_card_style === "summary"
      ? ("summary" as const)
      : ("summary_large_image" as const);
  const keywords = profile?.seo_keywords
    ?.split(",")
    .map((item: string) => item.trim())
    .filter(Boolean);

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: {
      canonical,
    },
    robots: profile?.seo_noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    ...(favicon
      ? {
          icons: {
            icon: [{ url: favicon }],
            shortcut: [{ url: favicon }],
            apple: [{ url: favicon }],
          },
        }
      : {}),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      type: "profile" as const,
      images: [socialImage],
    },
    twitter: {
      card: twitterCard,
      title: ogTitle,
      description: ogDescription,
      images: [socialImage],
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
    const canonicalUrl = publicProfileUrl(example.slug);
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              profileStructuredData({
                profile: example.profile,
                canonicalUrl,
              }),
            ),
          }}
        />
        <ProfileHub
          profile={example.profile}
          template={example.template}
          themeConfig={defaultProfileTheme(example.template)}
          mediaEmbeds={example.mediaEmbeds ?? []}
          products={example.products ?? []}
        />
      </>
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

  const [
    { data: links },
    { data: referrals },
    { data: socials },
    { data: products },
    { data: mediaEmbeds },
    { data: faqs },
    { data: highlights },
  ] =
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
      supabase
        .from("products")
        .select(
          "id,title,description,price_amount,currency,category,badge,image_path,destination_url,cta_label,is_featured,position",
        )
        .eq("user_id", profile.id)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("media_embeds")
        .select("id,title,provider,url,layout,position")
        .eq("user_id", profile.id)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("profile_faqs")
        .select("id,question,answer,position")
        .eq("user_id", profile.id)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("profile_highlights")
        .select("id,image_path,title,destination_url,position,expires_at")
        .eq("user_id", profile.id)
        .gt("expires_at", new Date().toISOString())
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
    tags: Array.isArray(profile.tags)
      ? profile.tags.filter((tag: unknown): tag is string => typeof tag === "string")
      : [],
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

  const canonicalUrl = publicProfileUrl(profile.username);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            profileStructuredData({
              profile: creatorProfile,
              canonicalUrl,
              createdAt: profile.created_at,
              updatedAt: profile.updated_at,
            }),
          ),
        }}
      />
      <ProfileHub
        profile={creatorProfile}
        template={profile.template}
        databaseProfileId={profile.id}
        published={published === "1"}
        showBadge={Boolean(profile.show_cueful_badge)}
        themeConfig={profile.theme_config}
        products={(products ?? []) as PublicProduct[]}
        mediaEmbeds={(mediaEmbeds ?? []) as PublicMediaEmbed[]}
        faqs={(faqs ?? []) as PublicFaq[]}
        highlights={(highlights ?? []) as PublicHighlight[]}
        disclosureText={profile.disclosure_text}
      />
    </>
  );
}
