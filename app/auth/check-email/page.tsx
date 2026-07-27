import MarkEmailReadOutlined from "@mui/icons-material/MarkEmailReadOutlined";
import { Divider, Typography } from "@mui/material";
import { AuthStateCard } from "@/components/auth-state-card";
import { ResendConfirmationForm } from "@/components/resend-confirmation-form";

export const metadata = {
  title: "Check your email | Cueful",
  description: "Continue your Cueful account setup from your inbox.",
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const recovery = type === "recovery";

  return (
    <AuthStateCard
      icon={<MarkEmailReadOutlined />}
      eyebrow={recovery ? "PASSWORD RESET SENT" : "ONE MORE STEP"}
      title="Check your inbox"
      description={
        recovery
          ? "Use the password reset link in the email we sent. For the smoothest handoff, open it in this browser."
          : "Use the confirmation link in the email we sent. After confirming, return here to continue."
      }
      primaryHref="/auth?mode=login"
      primaryLabel="Go to sign in"
      secondaryHref="/"
      secondaryLabel="Back to home"
    >
      <div className="auth-state-card__note">
        <Typography variant="body2" color="text.secondary">
          Email links expire and can only be used once. Check spam or promotions
          if it does not arrive within a few minutes.
        </Typography>
      </div>
      {!recovery && (
        <>
          <Divider sx={{ my: 3 }} />
          <ResendConfirmationForm />
        </>
      )}
    </AuthStateCard>
  );
}
