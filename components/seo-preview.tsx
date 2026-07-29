"use client";

import { Box, Typography } from "@mui/material";
import { publicProfileAddress } from "@/lib/brand";

export function resolveSeoTitle({
  seoTitle,
  displayName,
  username,
}: {
  seoTitle?: string | null;
  displayName?: string | null;
  username: string;
}) {
  return (
    seoTitle?.trim() ||
    displayName?.trim() ||
    `@${username}` ||
    "Your page"
  );
}

export function resolveSeoDescription({
  seoDescription,
  bio,
  username,
}: {
  seoDescription?: string | null;
  bio?: string | null;
  username: string;
}) {
  return (
    seoDescription?.trim() ||
    bio?.trim() ||
    `Links, resources, and referral offers from @${username}.`
  );
}

export function SeoPreview({
  title,
  description,
  username,
  imageUrl,
  socialTitle,
  socialDescription,
}: {
  title: string;
  description: string;
  username: string;
  imageUrl?: string | null;
  socialTitle?: string;
  socialDescription?: string;
}) {
  const address = publicProfileAddress(username || "username");
  const host = address.split("/")[0];
  const path = address.slice(host.length);
  const cardTitle = socialTitle?.trim() || title;
  const cardDescription = socialDescription?.trim() || description;

  return (
    <div className="seo-live-preview" aria-live="polite">
      <section className="seo-live-preview__panel">
        <span className="seo-live-preview__label">Search preview</span>
        <article className="seo-serp-card">
          <div className="seo-serp-card__site">
            <span className="seo-serp-card__favicon" aria-hidden />
            <Box>
              <strong>Cueful</strong>
              <small>
                https://{host}
                <span>{path || `/${username}`}</span>
              </small>
            </Box>
          </div>
          <Typography component="h4" className="seo-serp-card__title">
            {title}
          </Typography>
          <Typography className="seo-serp-card__snippet">{description}</Typography>
        </article>
      </section>

      <section className="seo-live-preview__panel">
        <span className="seo-live-preview__label">Social card preview</span>
        <article className="seo-social-card">
          <div className="seo-social-card__media">
            {imageUrl ? (
              <Box component="img" src={imageUrl} alt="" />
            ) : (
              <span>1200 × 630</span>
            )}
          </div>
          <div className="seo-social-card__copy">
            <small>{host.toUpperCase()}</small>
            <Typography component="h4">{cardTitle}</Typography>
            <Typography>{cardDescription}</Typography>
          </div>
        </article>
      </section>
    </div>
  );
}
