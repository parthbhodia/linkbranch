import { redirect } from "next/navigation";
import {
  OnboardingWizard,
  type OnboardingInitialData,
} from "@/components/onboarding-wizard";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Set up your profile | Linkbranch",
  description: "Add your profile details and links.",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { template } = await searchParams;
  const [{ data: profile }, { data: links }, { data: referrals }, { data: socials }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("links")
        .select("id,title,url,is_active,is_featured")
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("referrals")
        .select("id,provider,offer,url,code,is_active")
        .eq("user_id", user.id)
        .order("position"),
      supabase
        .from("social_links")
        .select("platform,url")
        .eq("user_id", user.id)
        .order("position"),
    ]);

  if (!profile) {
    redirect("/auth?error=profile_missing");
  }

  const initialData: OnboardingInitialData = {
    profile,
    links: links ?? [],
    referrals: referrals ?? [],
    socials: socials ?? [],
  };

  return (
    <OnboardingWizard
      initialTemplate={template ?? profile.template ?? "field-notes"}
      initialData={initialData}
    />
  );
}
