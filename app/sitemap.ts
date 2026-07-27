import type { MetadataRoute } from "next";
import { BRAND_URL } from "@/lib/brand";
import { exampleProfiles } from "@/lib/example-profiles";

export default function sitemap(): MetadataRoute.Sitemap {
  const updatedAt = new Date("2026-07-27");
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
  ];

  return [
    ...staticPages,
    ...exampleProfiles.map((example) => ({
      url: `${BRAND_URL}/u/${example.slug}`,
      lastModified: updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
