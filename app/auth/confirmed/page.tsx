import VerifiedRounded from "@mui/icons-material/VerifiedRounded";
import { AuthStateCard } from "@/components/auth-state-card";

export const metadata = {
  title: "Email confirmed | Linkbranch",
  description: "Your Linkbranch email address is confirmed.",
};

export default function ConfirmedPage() {
  return (
    <AuthStateCard
      icon={<VerifiedRounded />}
      eyebrow="EMAIL CONFIRMED"
      title="You’re verified"
      description="Your email address is confirmed. This browser could not carry the original signup session across, so sign in once to continue."
      primaryHref="/auth?mode=login"
      primaryLabel="Continue to sign in"
      secondaryHref="/"
      secondaryLabel="Back to home"
    />
  );
}
