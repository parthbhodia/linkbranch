import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = {
  title: "Reset password | Cueful",
  description: "Request a secure Cueful password reset link.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
