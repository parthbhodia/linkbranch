import { redirect } from "next/navigation";
import { EventCardScreen } from "@/components/event-card-screen";
import { createClient } from "@/lib/supabase/server";
import { readWalletConfig } from "@/lib/wallet-pass";

export const metadata = {
  title: "My card | Cueful",
  description: "Show your Cueful code at an event.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function CardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username,display_name,current_event_tag,onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth?error=profile_missing");
  }

  // Nothing to point a code at until the page exists.
  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <EventCardScreen
      profileId={profile.id}
      username={profile.username}
      displayName={profile.display_name}
      initialEventTag={profile.current_event_tag ?? ""}
      // Decided on the server so the button never appears where the route
      // would only 404 -- a deployment without Apple certificates is normal
      // locally and on previews.
      walletEnabled={readWalletConfig() !== null}
    />
  );
}
