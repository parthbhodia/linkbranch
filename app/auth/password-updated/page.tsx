import TaskAltRounded from "@mui/icons-material/TaskAltRounded";
import { AuthStateCard } from "@/components/auth-state-card";

export const metadata = {
  title: "Password updated | Cueful",
  description: "Your Cueful password has been updated.",
};

export default function PasswordUpdatedPage() {
  return (
    <AuthStateCard
      icon={<TaskAltRounded />}
      eyebrow="PASSWORD UPDATED"
      title="You’re back in control"
      description="Your new password is active and your account session is ready."
      primaryHref="/dashboard"
      primaryLabel="Open dashboard"
      secondaryHref="/"
      secondaryLabel="Back to home"
    />
  );
}
