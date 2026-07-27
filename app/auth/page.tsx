import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Sign in or create an account | Linkbranch",
  description: "Create and manage your Linkbranch profile.",
};

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthForm />;
}
