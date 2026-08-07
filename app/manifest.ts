import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cueful",
    short_name: "Cueful",
    description:
      "Your contact card, the people you meet, and the links behind them.",
    // Installed straight to /card: the reason to put this on a home screen is
    // to have your code one tap away at an event, not to browse the marketing
    // site. Signed-out visitors get bounced to /auth from there anyway.
    start_url: "/card",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf9f1",
    theme_color: "#20221c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Show my card",
        short_name: "My card",
        description: "Full-screen code to scan at an event",
        url: "/card",
      },
      {
        name: "People you met",
        short_name: "People",
        description: "Sort the contacts you collected",
        url: "/dashboard",
      },
    ],
  };
}
