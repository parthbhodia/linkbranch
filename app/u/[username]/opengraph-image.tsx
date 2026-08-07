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
  let tags: string[] = example?.profile.tags ?? [];
  let linkCount = example?.profile.links?.length ?? 0;
  let offerCount = example?.profile.referrals?.length ?? 0;
  let theme = example
    ? resolveProfileTheme(null, example.template)
    : resolveProfileTheme(null, "field-notes");

  if (!example) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,display_name,bio,avatar_path,template,theme_config,tags")
      .eq("username", handle)
      .eq("is_published", true)
      .maybeSingle();

    if (profile) {
      displayName = profile.display_name?.trim() || `@${handle}`;
      bio = profile.bio?.trim() || "";
      avatarUrl = publicAssetUrl(profile.avatar_path) ?? null;
      theme = resolveProfileTheme(profile.theme_config, profile.template);
      tags = Array.isArray(profile.tags) ? profile.tags : [];

      // Counts rather than a strapline: a card that says what is actually on
      // the page gives someone a reason to open it.
      const [{ count: links }, { count: offers }] = await Promise.all([
        supabase
          .from("links")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("is_active", true),
        supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("is_active", true),
      ]);
      linkCount = links ?? 0;
      offerCount = offers ?? 0;
    }
  }

  const counts = [
    linkCount ? `${linkCount} ${linkCount === 1 ? "link" : "links"}` : null,
    offerCount ? `${offerCount} ${offerCount === 1 ? "offer" : "offers"}` : null,
  ].filter(Boolean);

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
          // Centred as one block rather than spread to the edges. A profile
          // with a one-line bio and no tags has little to show; distributing
          // the slack evenly reads as a deliberately airy card, where
          // space-between left an obvious hole through the middle.
          justifyContent: "center",
          gap: 30,
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
              maxWidth: 1000,
              fontSize: 40,
              lineHeight: 1.3,
              color: muted,
            }}
          >
            {/* Trimmed rather than wrapped indefinitely: past roughly this much
                the text would run under the footer row. */}
            {bio.length > 150 ? `${bio.slice(0, 149).trimEnd()}…` : bio}
          </div>
        ) : null}

        {tags.length ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {tags.slice(0, 5).map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 999,
                  border: `2px solid ${muted}`,
                  color: muted,
                  fontSize: 26,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
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
          {counts.length ? (
            <div style={{ display: "flex", fontSize: 26, color: muted }}>
              {counts.join(" · ")}
            </div>
          ) : null}
        </div>
      </div>
    ),
    size,
  );
}
