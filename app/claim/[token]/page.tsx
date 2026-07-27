import { notFound } from "next/navigation";
import { ClaimPanel } from "@/components/claim-panel";
import { ProfileHub } from "@/components/profile-hub";
import { createClient } from "@/lib/supabase/server";
import type { CreatorProfile } from "@/lib/types";

const linkColors = ["#c9ef69", "#ffb4d0", "#9ed6ff", "#ffd166"];

export const dynamic = "force-dynamic";

// Each token is sent to exactly one creator. These pages must never be
// indexed — a crawler finding one would expose the outreach list.
export const metadata = {
  title: "Claim your page | Cueful",
  robots: { index: false, follow: false, nocache: true },
};

type DraftPayload = {
  display_name?: string;
  bio?: string;
  template?: string;
  links?: Array<{ title: string; subtitle?: string; url: string }>;
  socials?: Array<{ platform: string; url: string }>;
};

type Draft = {
  token: string;
  source_url: string;
  suggested_username: string | null;
  display_name: string;
  payload: DraftPayload;
  is_claimed: boolean;
  username_available: boolean;
};

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // claim_drafts grants nothing to anon; the security-definer function is the
  // only way in, and it requires the exact token.
  const { data, error } = await supabase.rpc("get_claim_draft", {
    draft_token: token,
  });

  if (error || !data) {
    notFound();
  }

  const draft = data as Draft;
  const payload = draft.payload ?? {};
  const displayName = payload.display_name || draft.display_name || "Creator";

  const initials =
    displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CF";

  const previewProfile: CreatorProfile = {
    username: draft.suggested_username ?? "your-page",
    initials,
    displayName,
    // Drafts carry no greeting/headline of their own, so fall back to the same
    // defaults public.profiles uses for a fresh account.
    greeting: "Hey, I’m",
    headline: "I make useful",
    headlineAccent: "things.",
    eyebrow: draft.suggested_username ? `@${draft.suggested_username}` : "Preview",
    bio: payload.bio ?? "",
    socials: (payload.socials ?? []).map((item) => ({
      platform: item.platform,
      url: item.url,
    })),
    links: (payload.links ?? []).map((item, index) => ({
      id: `draft-${index}`,
      index: String(index + 1).padStart(2, "0"),
      title: item.title,
      subtitle: item.subtitle || "",
      url: item.url,
      tags: [item.title, item.subtitle ?? ""],
      visits: 0,
      color: linkColors[index % linkColors.length],
    })),
    referrals: [],
  };

  return (
    <>
      <ClaimPanel
        token={draft.token}
        suggestedUsername={draft.suggested_username}
        usernameAvailable={draft.username_available}
        isClaimed={draft.is_claimed}
        sourceUrl={draft.source_url}
      />
      {/* No databaseProfileId: there is no profiles row yet, so ProfileHub
          must not try to write click_events against one. */}
      <ProfileHub profile={previewProfile} template={payload.template} />
    </>
  );
}
