"use client";

import { Box, Typography } from "@mui/material";
import { BrandMark } from "@/components/brand-mark";

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <BrandMark />
        <Box className="auth-story__copy">
          <p className="section-label">YOUR CORNER OF THE INTERNET</p>
          <Typography component="h1" variant="h1">
            One profile.<br />
            Every useful <span className="headline-accent">cue.</span>
          </Typography>
          <Typography className="auth-story__body" color="text.secondary">
            Publish your work, referral offers, and favorite resources without
            handing your audience to an algorithm.
          </Typography>
        </Box>
        <Typography className="auth-story__footer" variant="caption" color="text.secondary">
          Your account, content, and analytics stay together.
        </Typography>
      </section>

      <section className="auth-panel">{children}</section>
    </main>
  );
}
