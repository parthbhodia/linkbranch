"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { createClient } from "@/lib/supabase/client";

export function ClaimPanel({
  token,
  suggestedUsername,
  usernameAvailable,
  isClaimed,
  sourceUrl,
}: {
  token: string;
  suggestedUsername: string | null;
  usernameAvailable: boolean;
  isClaimed: boolean;
  sourceUrl: string;
}) {
  const pinged = useRef(false);

  useEffect(() => {
    // The ping lives here rather than in the server component on purpose:
    // link-preview crawlers (including Instagram's, when the URL is pasted
    // into a DM) fetch the HTML but never run JS. Recording server-side would
    // mark every draft as viewed the moment it was sent.
    if (pinged.current) return;
    pinged.current = true; // StrictMode invokes effects twice in dev
    void createClient().rpc("record_claim_view", { draft_token: token });
  }, [token]);

  const signupHref = suggestedUsername && usernameAvailable
    ? `/auth?username=${encodeURIComponent(suggestedUsername)}&claim=${encodeURIComponent(token)}`
    : `/auth?claim=${encodeURIComponent(token)}`;

  return (
    <Box className="claim-panel">
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip size="small" label={isClaimed ? "Already claimed" : "Preview"} />
          <Typography variant="body2" color="text.secondary">
            Built from{" "}
            <Box component="span" sx={{ wordBreak: "break-all" }}>
              {sourceUrl.replace(/^https?:\/\//, "")}
            </Box>
          </Typography>
        </Stack>

        {isClaimed ? (
          <Typography variant="body2" color="text.secondary">
            This page has already been claimed. If that was you, sign in to edit it.
          </Typography>
        ) : (
          <Typography variant="h6" component="p">
            This page isn&apos;t live yet — it&apos;s yours to claim.
          </Typography>
        )}

        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button component={Link} href={signupHref} variant="contained">
            {isClaimed ? "Sign in" : "Claim this page"}
          </Button>
          {!isClaimed && suggestedUsername && (
            <Typography variant="body2" color="text.secondary" alignSelf="center">
              {usernameAvailable
                ? `cueful.bio/u/${suggestedUsername} is still free`
                : `${suggestedUsername} is taken — you can pick another`}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
