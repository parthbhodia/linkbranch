import type { Metadata } from "next";
import Link from "next/link";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ArrowOutwardRounded from "@mui/icons-material/ArrowOutwardRounded";
import { BRAND_URL } from "@/lib/brand";
import { exampleProfiles } from "@/lib/example-profiles";
import { publicAssetUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Discover Creator Link Pages | Cueful",
  description:
    "Explore opt-in Cueful profiles from creators, freelancers, musicians, and referral curators.",
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "Discover Creator Link Pages | Cueful",
    description:
      "A rotating collection of creator pages made with Cueful.",
    url: "/discover",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

type DiscoverProfile = {
  id: string;
  username: string;
  display_name: string;
  headline: string;
  headline_accent: string;
  bio: string;
  avatar_path: string | null;
  template: string;
  updated_at: string;
  referrals: number;
};

export default async function DiscoverPage() {
  const supabase = await createClient();
  const [{ data: profiles }, { data: referredProfiles }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id,username,display_name,headline,headline_accent,bio,avatar_path,template,updated_at",
      )
      .eq("is_published", true)
      .eq("is_discoverable", true)
      .order("updated_at", { ascending: false })
      .limit(60),
    supabase
      .from("profiles")
      .select("referred_by")
      .eq("is_published", true)
      .not("referred_by", "is", null),
  ]);

  const referralCounts = new Map<string, number>();
  (referredProfiles ?? []).forEach((profile) => {
    if (!profile.referred_by) return;
    referralCounts.set(
      profile.referred_by,
      (referralCounts.get(profile.referred_by) ?? 0) + 1,
    );
  });

  const discoverProfiles: DiscoverProfile[] = (profiles ?? [])
    .map((profile) => ({
      ...profile,
      referrals: referralCounts.get(profile.id) ?? 0,
    }))
    .sort(
      (left, right) =>
        right.referrals - left.referrals ||
        new Date(right.updated_at).getTime() -
          new Date(left.updated_at).getTime(),
    );

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Cueful creator profiles",
    itemListElement: discoverProfiles.map((profile, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BRAND_URL}/u/${profile.username}`,
      name: profile.display_name,
    })),
  };

  return (
    <main className="discover-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <nav className="seo-nav" aria-label="Primary navigation">
        <Link className="seo-nav__brand" href="/">cueful.</Link>
        <div>
          <Link href="/best-link-in-bio-tools">Compare tools</Link>
          <Link href="/templates">Templates</Link>
          <Link className="seo-button seo-button--small" href="/auth">Start free</Link>
        </div>
      </nav>

      <header className="discover-hero">
        <p className="seo-eyebrow">OPT-IN CREATOR DIRECTORY</p>
        <h1>Pages worth opening.</h1>
        <p>
          A rotating collection of creators who chose to be discovered. Published
          referrals lift a profile in the list; nobody is enrolled automatically.
        </p>
        <Link className="seo-button" href="/auth?mode=signup&utm_source=discover">
          Create your page
          <ArrowForwardRounded aria-hidden="true" />
        </Link>
      </header>

      {discoverProfiles.length > 0 ? (
        <section className="discover-grid" aria-label="Discoverable Cueful profiles">
          {discoverProfiles.map((profile, index) => (
            <Link
              className={`discover-card discover-card--${profile.template}`}
              href={`/u/${profile.username}`}
              key={profile.id}
            >
              <div className="discover-card__meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{profile.referrals} REFERRALS</span>
                <ArrowOutwardRounded aria-hidden="true" />
              </div>
              <div className="discover-card__avatar">
                {profile.avatar_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publicAssetUrl(profile.avatar_path)}
                    alt={`${profile.display_name} profile`}
                  />
                ) : (
                  profile.display_name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                )}
              </div>
              <small>@{profile.username}</small>
              <h2>
                {profile.headline} <em>{profile.headline_accent}</em>
              </h2>
              <p>{profile.bio}</p>
            </Link>
          ))}
        </section>
      ) : (
        <section className="discover-empty">
          <div>
            <p className="seo-eyebrow">FOUNDING DIRECTORY</p>
            <h2>The first opt-in profiles will appear here.</h2>
            <p>
              Until then, these three working examples show the range Cueful is
              designed to support.
            </p>
          </div>
          <div>
            {exampleProfiles.map((example, index) => (
              <Link href={`/u/${example.slug}`} key={example.slug}>
                <span>0{index + 1} / {example.role}</span>
                <b>{example.profile.displayName}</b>
                <p>{example.profile.bio}</p>
                <ArrowOutwardRounded aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="seo-footer">
        <Link href="/">cueful.</Link>
        <p>Discovery is voluntary. Clear links stay the priority.</p>
        <nav aria-label="Footer navigation">
          <Link href="/free-linktree-alternative">Switch from Linktree</Link>
          <Link href="/link-in-bio-tools">Compare tools</Link>
          <Link href="/auth">Create a page</Link>
        </nav>
      </footer>
    </main>
  );
}
