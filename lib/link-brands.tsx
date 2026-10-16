import type { ReactNode } from "react";

export type LinkBrandId = "partiful" | "beli" | "beacons";

export type LinkBrand = {
  id: LinkBrandId;
  label: string;
  subtitle: string;
  placeholder: string;
  hostPatterns: string[];
  /** Tile fill behind the brand mark. */
  color: string;
  /** Glyph / mark color on the tile. */
  ink: string;
  icon: ReactNode;
};

function BrandMark({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden
      focusable="false"
      role="img"
    >
      <title>{label}</title>
      {children}
    </svg>
  );
}

/** Stylized “P” mark — reads as Partiful at link-tile size. */
function PartifulMark() {
  return (
    <BrandMark label="Partiful">
      <path
        fill="currentColor"
        d="M7.2 4.4h6.1c3.2 0 5.3 1.8 5.3 4.7 0 2.9-2.1 4.7-5.3 4.7H10.5v5.8H7.2V4.4Zm3.3 7h2.6c1.6 0 2.5-.9 2.5-2.3s-.9-2.3-2.5-2.3h-2.6v4.6Z"
      />
      <circle fill="currentColor" cx="18.6" cy="5.2" r="1.35" />
      <circle fill="currentColor" cx="20.4" cy="8.1" r="0.9" />
    </BrandMark>
  );
}

/** Bold “B” mark — reads as Beli at link-tile size. */
function BeliMark() {
  return (
    <BrandMark label="Beli">
      <path
        fill="currentColor"
        d="M7 4.3h6.2c2.9 0 4.8 1.5 4.8 3.8 0 1.5-.8 2.7-2.2 3.3 1.7.6 2.7 1.9 2.7 3.7 0 2.5-2 4.1-5.1 4.1H7V4.3Zm3.2 5.7h2.7c1.3 0 2-.6 2-1.6s-.7-1.6-2-1.6h-2.7v3.2Zm0 6.4h3.1c1.5 0 2.3-.7 2.3-1.8s-.8-1.8-2.3-1.8h-3.1v3.6Z"
      />
    </BrandMark>
  );
}

/** Beacon pulse mark for Beacons.ai hubs. */
function BeaconsMark() {
  return (
    <BrandMark label="Beacons">
      <path
        fill="currentColor"
        d="M12 3.2c.6 2.4 1.9 4.2 3.9 5.5-2 .8-3.3 2.4-3.9 4.7-.6-2.3-1.9-3.9-3.9-4.7 2-1.3 3.3-3.1 3.9-5.5Z"
      />
      <path
        fill="currentColor"
        d="M7.2 14.2c1.1.7 1.8 1.7 2.1 3-.3-1.3-1-2.3-2.1-3Zm9.6 0c-1.1.7-1.8 1.7-2.1 3 .3-1.3 1-2.3 2.1-3ZM11.1 18.4h1.8v2.4h-1.8z"
      />
    </BrandMark>
  );
}

export const linkBrands: LinkBrand[] = [
  {
    id: "partiful",
    label: "Partiful",
    subtitle: "RSVP on Partiful",
    placeholder: "https://partiful.com/e/…",
    hostPatterns: ["partiful.com", "go.partiful.com"],
    color: "#FF4D8D",
    ink: "#ffffff",
    icon: <PartifulMark />,
  },
  {
    id: "beli",
    label: "Beli",
    subtitle: "Food picks on Beli",
    placeholder: "https://beliapp.co/…",
    hostPatterns: ["beliapp.co", "beliapp.com", "beli.app"],
    color: "#FF5A3D",
    ink: "#ffffff",
    icon: <BeliMark />,
  },
  {
    id: "beacons",
    label: "Beacons",
    subtitle: "Open on Beacons",
    placeholder: "https://beacons.ai/username",
    hostPatterns: ["beacons.ai", "shop.beacons.ai"],
    color: "#6C4DFF",
    ink: "#ffffff",
    icon: <BeaconsMark />,
  },
];

export function detectLinkBrand(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return (
      linkBrands.find((brand) =>
        brand.hostPatterns.some(
          (pattern) => host === pattern || host.endsWith(`.${pattern}`),
        ),
      ) ?? null
    );
  } catch {
    return null;
  }
}
