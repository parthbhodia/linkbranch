#!/usr/bin/env node
// Mint a claim draft from a spec file in drafts/.
//
//   node scripts/create-claim-draft.mjs drafts/nails-by-lana.json
//   node scripts/create-claim-draft.mjs drafts/nails-by-lana.json --apply
//
// Without --apply the script validates the spec, mints a token and prints the
// INSERT to stdout, so the row can be pasted into the Supabase SQL editor and
// read before it lands. With --apply it inserts through the service-role key
// (SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL): claim_drafts revokes
// all access from anon and authenticated, so nothing weaker can write it.
//
// Validation here mirrors the table constraints exactly. A spec that fails in
// Postgres fails after the outreach link is already in a DM, so it has to fail
// on this side first.

import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import process from "node:process";

const TEMPLATES = ["field-notes", "after-dark", "soft-studio", "signal-deck"];

// lib/social-platforms.tsx matches with `option.label === platform`, so these
// are character-for-character the labels that resolve to a real icon. Anything
// else renders as a generic globe on the claimed page.
const SOCIAL_LABELS = [
  "Instagram",
  "X / Twitter",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "GitHub",
  "Threads",
  "Facebook",
  "Pinterest",
  "Twitch",
  "Discord",
  "Bluesky",
  "WhatsApp Business",
  "Website",
];

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,29}$/;
const HTTP_URL_PATTERN = /^https?:\/\//i;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function checkLength(errors, label, value, max, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) errors.push(`${label} is required`);
    return;
  }
  if (typeof value !== "string") {
    errors.push(`${label} must be a string`);
    return;
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) errors.push(`${label} must not be empty`);
  if (trimmed.length > max) {
    errors.push(`${label} is ${trimmed.length} chars, max ${max}`);
  }
}

function validate(spec) {
  const errors = [];

  checkLength(errors, "source_url", spec.source_url, 2048, { required: true });
  if (spec.source_url && !HTTP_URL_PATTERN.test(spec.source_url)) {
    errors.push("source_url must start with http:// or https://");
  }

  checkLength(errors, "display_name", spec.display_name, 80, { required: true });

  if (spec.suggested_username !== undefined && spec.suggested_username !== null) {
    if (!USERNAME_PATTERN.test(spec.suggested_username)) {
      errors.push(
        `suggested_username "${spec.suggested_username}" must be 3-30 chars of a-z, 0-9, _ or -, starting alphanumeric`,
      );
    }
  }

  checkLength(errors, "bio", spec.bio, 160);
  checkLength(errors, "greeting", spec.greeting, 32);
  checkLength(errors, "headline", spec.headline, 48);
  checkLength(errors, "headline_accent", spec.headline_accent, 24);
  checkLength(errors, "eyebrow", spec.eyebrow, 60);

  if (spec.template !== undefined && !TEMPLATES.includes(spec.template)) {
    errors.push(`template must be one of ${TEMPLATES.join(", ")}`);
  }

  if (spec.tags !== undefined) {
    if (!Array.isArray(spec.tags)) {
      errors.push("tags must be an array");
    } else {
      if (spec.tags.length > 16) errors.push("tags has more than 16 entries");
      spec.tags.forEach((tag, index) => {
        checkLength(errors, `tags[${index}]`, tag, 40, { required: true });
      });
    }
  }

  const links = spec.links ?? [];
  if (!Array.isArray(links)) {
    errors.push("links must be an array");
  } else {
    links.forEach((link, index) => {
      checkLength(errors, `links[${index}].title`, link?.title, 100, {
        required: true,
      });
      checkLength(errors, `links[${index}].subtitle`, link?.subtitle, 100);
      // claim_draft() silently drops any link whose URL is not http(s) --
      // a typo here means a missing row on the claimed page, not an error.
      if (!HTTP_URL_PATTERN.test(link?.url ?? "")) {
        errors.push(
          `links[${index}].url must start with http:// or https:// (got ${JSON.stringify(link?.url)})`,
        );
      }
    });
  }

  const socials = spec.socials ?? [];
  if (!Array.isArray(socials)) {
    errors.push("socials must be an array");
  } else {
    const seen = new Set();
    socials.forEach((social, index) => {
      const platform = social?.platform;
      if (!SOCIAL_LABELS.includes(platform)) {
        errors.push(
          `socials[${index}].platform must be one of: ${SOCIAL_LABELS.join(", ")}`,
        );
      }
      // claim_draft() dedupes case-insensitively to protect the
      // (user_id, platform) unique index, keeping only the first entry.
      const key = String(platform).toLowerCase();
      if (seen.has(key)) errors.push(`socials[${index}] duplicates ${platform}`);
      seen.add(key);
      if (!HTTP_URL_PATTERN.test(social?.url ?? "")) {
        errors.push(
          `socials[${index}].url must start with http:// or https:// (got ${JSON.stringify(social?.url)})`,
        );
      }
    });
  }

  if (spec.expires_in_days !== undefined) {
    if (!Number.isInteger(spec.expires_in_days) || spec.expires_in_days < 1) {
      errors.push("expires_in_days must be a positive integer");
    }
  }

  return errors;
}

function buildPayload(spec) {
  // Only keys the claim page and claim_draft() read. Anything else in the spec
  // stays out of the row so the payload cannot quietly grow a shadow schema.
  const payload = {
    display_name: spec.display_name,
    bio: spec.bio ?? "",
  };
  for (const key of ["greeting", "headline", "headline_accent", "eyebrow", "template"]) {
    if (spec[key] !== undefined) payload[key] = spec[key];
  }
  if (spec.tags?.length) payload.tags = spec.tags;
  payload.links = (spec.links ?? []).map((link) => ({
    title: link.title,
    ...(link.subtitle ? { subtitle: link.subtitle } : {}),
    url: link.url,
  }));
  payload.socials = (spec.socials ?? []).map((social) => ({
    platform: social.platform,
    url: social.url,
  }));
  return payload;
}

function quote(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const specPath = args.find((arg) => !arg.startsWith("--"));

  if (!specPath) {
    fail("usage: node scripts/create-claim-draft.mjs <spec.json> [--apply]");
  }

  let spec;
  try {
    spec = JSON.parse(await readFile(specPath, "utf8"));
  } catch (error) {
    fail(`could not read ${specPath}: ${error.message}`);
  }

  const errors = validate(spec);
  if (errors.length > 0) {
    console.error(`${specPath} is not a valid claim draft:`);
    for (const message of errors) console.error(`  - ${message}`);
    process.exit(1);
  }

  // 32 hex chars sits inside claim_drafts_token_length (24..64) and is the
  // only secret protecting the draft: get_claim_draft() takes an exact token
  // and the table grants nothing to anon, so guessing it is the whole attack.
  const token = spec.token ?? randomBytes(16).toString("hex");
  const payload = buildPayload(spec);
  const expiresInDays = spec.expires_in_days ?? 30;

  const sql = `insert into public.claim_drafts
  (token, source_url, suggested_username, display_name, payload, expires_at)
values (
  ${quote(token)},
  ${quote(spec.source_url)},
  ${quote(spec.suggested_username ?? null)},
  ${quote(spec.display_name)},
  ${quote(JSON.stringify(payload))}::jsonb,
  now() + interval '${expiresInDays} days'
);`;

  if (!apply) {
    console.log(sql);
    console.error("");
    console.error(`draft url: /claim/${token}`);
    console.error("(not inserted -- re-run with --apply, or paste the SQL above)");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    fail(
      "--apply needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment",
    );
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const expiresAt = new Date(
    Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("claim_drafts").insert({
    token,
    source_url: spec.source_url,
    suggested_username: spec.suggested_username ?? null,
    display_name: spec.display_name,
    payload,
    expires_at: expiresAt,
  });

  if (error) fail(`insert failed: ${error.message}`);

  console.log(`/claim/${token}`);
}

await main();
