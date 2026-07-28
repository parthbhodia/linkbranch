import type { MetadataRoute } from "next";
import { BRAND_URL } from "@/lib/brand";
import { exampleProfiles } from "@/lib/example-profiles";
import { seoPages } from "@/lib/seo-pages";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const updatedAt = new Date("2026-07-28");
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BRAND_URL,
      lastModified: updatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BRAND_URL}/templates`,
      lastModified: updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BRAND_URL}/demo`,
      lastModified: updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BRAND_URL}/discover`,
      lastModified: updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BRAND_URL}/privacy`,
      lastModified: updatedAt,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...seoPages.map((page) => ({
      url: `${BRAND_URL}${page.path}`,
      lastModified: updatedAt,
      changeFrequency: "monthly" as const,
      priority:
        page.path === "/free-linktree-alternative" ||
        page.path === "/free-link-in-bio"
          ? 0.9
          : 0.72,
      alternates:
        page.path === "/what-does-link-in-bio-mean" ||
        page.path === "/it/cosa-significa-link-in-bio" ||
        page.path === "/es/que-significa-link-en-bio"
          ? {
              languages: {
                en: `${BRAND_URL}/what-does-link-in-bio-mean`,
                es: `${BRAND_URL}/es/que-significa-link-en-bio`,
                it: `${BRAND_URL}/it/cosa-significa-link-in-bio`,
                "x-default": `${BRAND_URL}/what-does-link-in-bio-mean`,
              },
            }
          : undefined,
    })),
  ];

  let publishedProfiles: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("username,updated_at")
      .eq("is_published", true)
      .neq("bio", "")
      .order("updated_at", { ascending: false })
      .limit(5000);

    publishedProfiles = (data ?? []).map((profile) => ({
      url: `${BRAND_URL}/u/${encodeURIComponent(profile.username)}`,
      lastModified: new Date(profile.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    }));
  } catch {
    // Keep the marketing sitemap available during local builds or temporary
    // database outages. The hourly refresh will repopulate profile entries.
  }

  return [
    ...staticPages,
    ...exampleProfiles.map((example) => ({
      url: `${BRAND_URL}/u/${example.slug}`,
      lastModified: updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...publishedProfiles,
  ];
}
