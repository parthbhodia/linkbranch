import { Box, Skeleton, Stack } from "@mui/material";

/**
 * Dashboard shell while its parallel queries resolve.
 *
 * Deliberately not an `app/dashboard/loading.tsx`: a loading boundary above the
 * page flushes the response before the page's auth and profile checks run, so a
 * signed-out visitor got a 200 whose redirect only happened after hydration
 * instead of a plain 307 to /auth. As an in-page fallback the placeholder still
 * covers the slow queries, and the redirects stay real.
 */
export function DashboardSkeleton() {
  return (
    <Box
      className="workspace-shell"
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <Stack sx={{ alignItems: "center", pt: 3 }}>
        <Skeleton variant="rounded" width={40} height={40} />
      </Stack>
      <Stack sx={{ p: 3 }} spacing={2}>
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={300} />
        <Skeleton variant="rounded" height={180} />
      </Stack>
      <Stack sx={{ p: 3 }} spacing={2}>
        <Skeleton variant="rounded" height={340} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
      <span className="sr-only">Loading dashboard</span>
    </Box>
  );
}
