import { redirect } from "next/navigation";
import { OutreachRadar } from "@/components/outreach-radar";
import { BrandMark } from "@/components/brand-mark";
import type { OutreachTarget } from "@/lib/outreach";
import { createClient } from "@/lib/supabase/server";
import { Box, Container, Stack, Typography } from "@mui/material";

export const metadata = {
  title: "Outreach radar | Cueful",
  description: "Find Reddit and X posts to promote Cueful.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?mode=login&next=/outreach");
  }

  const { data, error } = await supabase
    .from("outreach_targets")
    .select("*")
    .order("target_score", { ascending: false });

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="error">Could not load targets: {error.message}</Typography>
      </Container>
    );
  }

  return (
    <Box className="outreach-page">
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <BrandMark />
            <Typography variant="body2" color="text.secondary">
              Signed in · internal
            </Typography>
          </Stack>
          <OutreachRadar initialTargets={(data ?? []) as OutreachTarget[]} />
        </Stack>
      </Container>
    </Box>
  );
}
