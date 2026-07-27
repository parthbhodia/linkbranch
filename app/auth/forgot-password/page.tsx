import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = {
  title: "Reset password | Linkbranch",
  description: "Request a secure Linkbranch password reset link.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
