import type { MetadataRoute } from "next";
import { BRAND_URL } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/auth/",
          "/dashboard",
          "/onboarding",
        ],
      },
    ],
    sitemap: `${BRAND_URL}/sitemap.xml`,
  };
}
