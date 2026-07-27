import LinkOffRounded from "@mui/icons-material/LinkOffRounded";
import { AuthStateCard } from "@/components/auth-state-card";

export const metadata = {
  title: "Authentication link problem | Cueful",
  description: "Recover from an expired or invalid Cueful authentication link.",
};

const states = {
  recovery_session_missing: {
    eyebrow: "RESET SESSION MISSING",
    title: "Open the link in this browser",
    description:
      "The reset link was valid, but its secure browser session was not available. Request a fresh link, then open it in the same browser where you made the request.",
    primaryHref: "/auth/forgot-password",
    primaryLabel: "Request another reset link",
  },
  link_invalid: {
    eyebrow: "LINK NO LONGER ACTIVE",
    title: "That link has expired",
    description:
      "Authentication links are single-use and time limited. You may already be confirmed; try signing in, or request a new confirmation email.",
    primaryHref: "/auth?mode=login",
    primaryLabel: "Try signing in",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const state =
    states[code as keyof typeof states] ?? states.link_invalid;

  return (
    <AuthStateCard
      icon={<LinkOffRounded />}
      eyebrow={state.eyebrow}
      title={state.title}
      description={state.description}
      primaryHref={state.primaryHref}
      primaryLabel={state.primaryLabel}
      secondaryHref="/auth/check-email?type=confirmation"
      secondaryLabel="Confirmation help"
    />
  );
}
