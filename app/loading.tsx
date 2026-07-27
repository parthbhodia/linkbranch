import { Box, Skeleton, Stack } from "@mui/material";

export default function Loading() {
  return (
    <Box className="loading-shell" role="status" aria-busy="true" aria-label="Loading profile">
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
