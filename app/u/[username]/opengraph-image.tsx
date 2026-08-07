import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { resolveProfileTheme } from "@/lib/theme-config";
import { publicAssetUrl } from "@/lib/storage";
import { BRAND_DOMAIN } from "@/lib/brand";
import { exampleProfileBySlug } from "@/lib/example-profiles";

export const alt = "Creator profile on Cueful";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Reached at /u/<name>/opengraph-image. proxy.ts only rewrites single-segment
// paths and only 308s the two-segment /u/<name>, so this three-segment path
// passes straight through to the router.
export default async function ProfileOpenGraphImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const handle = username.toLowerCase();

  const example = exampleProfileBySlug.get(handle);
  let displayName = example?.profile.displayName ?? `@${handle}`;
  let bio = example?.profile.bio ?? "";
  let avatarUrl: string | null = example?.profile.avatarUrl ?? null;
  let theme = example
    ? resolveProfileTheme(null, example.template)
    : resolveProfileTheme(null, "field-notes");

  if (!example) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name,bio,avatar_path,template,theme_config")
      .eq("username", handle)
      .eq("is_published", true)
      .maybeSingle();

    if (profile) {
      displayName = profile.display_name?.trim() || `@${handle}`;
      bio = profile.bio?.trim() || "";
      avatarUrl = publicAssetUrl(profile.avatar_path) ?? null;
      theme = resolveProfileTheme(profile.theme_config, profile.template);
    }
  }

  const { background, surface, text, muted, accent } = theme.colors;
  const initials =
    displayName
      .replace(/^@/, "")
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CF";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: 72,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: text,
          backgroundColor: background,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              width={132}
              height={132}
              alt=""
              style={{ borderRadius: 999, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 132,
                height: 132,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                backgroundColor: accent,
                color: background,
                fontSize: 52,
                fontWeight: 800,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 62, fontWeight: 800, letterSpacing: -2 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 30, color: muted }}>{`@${handle}`}</div>
          </div>
        </div>

        {bio ? (
          <div
            style={{
              display: "flex",
              maxWidth: 940,
              fontSize: 38,
              lineHeight: 1.35,
              color: muted,
            }}
          >
            {/* Trimmed rather than wrapped indefinitely: past roughly this much
                the text would run under the footer row. */}
            {bio.length > 150 ? `${bio.slice(0, 149).trimEnd()}…` : bio}
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              padding: "14px 26px",
              borderRadius: 999,
              backgroundColor: surface,
              color: text,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {`${BRAND_DOMAIN}/${handle}`}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: muted }}>
            Links · offers · signals
          </div>
        </div>
      </div>
    ),
    size,
  );
}
