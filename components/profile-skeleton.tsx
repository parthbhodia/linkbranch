import { Box, Skeleton, Stack } from "@mui/material";

/**
 * Loading shell for a public profile, matching the two-column `.app-shell`
 * layout ProfileHub renders into.
 *
 * Used as a Suspense fallback *inside* the page, after the handle is known to
 * exist. It is deliberately not an `app/u/[username]/loading.tsx`: a loading
 * boundary above the page flushes the response before `notFound()` runs, which
 * locks the status at 200 and turns every missing handle into a soft 404.
 */
export function ProfileSkeleton() {
  return (
    <Box
      className="loading-shell"
      role="status"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <Stack className="loading-profile" spacing={2}>
        <Skeleton variant="circular" width={88} height={88} />
        <Skeleton variant="text" width="68%" height={56} />
        <Skeleton variant="text" width="82%" height={28} />
        <Stack direction="row" spacing={1}>
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} variant="rounded" width={92} height={36} />
          ))}
        </Stack>
      </Stack>
      <Stack className="loading-content" spacing={1.5}>
        <Skeleton variant="rounded" height={56} />
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} variant="rounded" height={102} />
        ))}
      </Stack>
      <span className="sr-only">Loading profile</span>
    </Box>
  );
}
