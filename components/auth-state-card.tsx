"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { AuthFrame } from "@/components/auth-frame";

export function AuthStateCard({
  icon,
  eyebrow,
  title,
  description,
  children,
  primaryHref,
  primaryLabel,
  secondaryHref = "/auth",
  secondaryLabel = "Back to sign in",
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <AuthFrame>
      <Paper className="auth-card auth-state-card" variant="outlined">
        <Box className="auth-state-card__icon" aria-hidden="true">
          {icon}
        </Box>
        <Typography className="section-label" component="p">
          {eyebrow}
        </Typography>
        <Typography component="h2" variant="h2">
          {title}
        </Typography>
        <Typography color="text.secondary" className="auth-state-card__description">
          {description}
        </Typography>

        {children}

        <Stack className="auth-state-card__actions" spacing={1.25}>
          {primaryHref && primaryLabel && (
            <Button
              component={Link}
              href={primaryHref}
              variant="contained"
              size="large"
              endIcon={<ArrowForwardRounded />}
            >
              {primaryLabel}
            </Button>
          )}
          <Button
            component={Link}
            href={secondaryHref}
            color="inherit"
            startIcon={<ArrowBackRounded />}
          >
            {secondaryLabel}
          </Button>
        </Stack>
      </Paper>
    </AuthFrame>
  );
}
