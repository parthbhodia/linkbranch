import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Choose a new password | Linkbranch",
  description: "Set a new password for your Linkbranch account.",
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/error?code=recovery_session_missing");
  }

  return <ResetPasswordForm />;
}
