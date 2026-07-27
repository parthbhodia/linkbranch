import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cueful",
    short_name: "Cueful",
    description:
      "Creator links, referral offers, and useful audience analytics.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f1",
    theme_color: "#20221c",
  };
}
