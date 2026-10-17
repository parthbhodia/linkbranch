import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveAvatarPresentation,
  type ProfileThemeConfig,
} from "./theme-config.ts";

// Only the avatar fields matter here; the resolver reads nothing else.
const theme = (over: Partial<ProfileThemeConfig> = {}) =>
  ({ colors: {}, ...over }) as ProfileThemeConfig;

test("without the hero, the three settings pass through untouched", () => {
  const got = resolveAvatarPresentation(
    theme({ avatarShape: "square", avatarRing: true, avatarBackdrop: true }),
    true,
  );
  assert.deepEqual(got, {
    hero: false,
    shape: "square",
    ring: true,
    backdrop: true,
  });
});

test("the hero REPLACES shape, frame and the faded backdrop", () => {
  // The founder's call: across-the-top supersedes the other three rather than
  // composing with them. A page that had a frame must not keep a stray ring
  // floating behind its hero.
  const got = resolveAvatarPresentation(
    theme({
      avatarHero: true,
      avatarShape: "square",
      avatarRing: true,
      avatarBackdrop: true,
    }),
    true,
  );
  assert.deepEqual(got, {
    hero: true,
    shape: undefined,
    ring: false,
    backdrop: false,
  });
});

test("no photo means no hero, whatever the theme says", () => {
  // Blowing two initials up full width is worse than the avatar it replaced.
  const got = resolveAvatarPresentation(theme({ avatarHero: true }), false);
  assert.equal(got.hero, false);
});

test("no photo means no faded backdrop either", () => {
  // The wash is a blurred copy of the photo, so it needs one.
  const got = resolveAvatarPresentation(theme({ avatarBackdrop: true }), false);
  assert.equal(got.backdrop, false);
});

test("a shape still applies when there is no photo", () => {
  // The initials tile is shaped too, so this one does not need a photo.
  const got = resolveAvatarPresentation(theme({ avatarShape: "rounded" }), false);
  assert.equal(got.shape, "rounded");
});

test("absent fields are off, never undefined-ish truthy", () => {
  const got = resolveAvatarPresentation(theme(), true);
  assert.deepEqual(got, {
    hero: false,
    shape: undefined,
    ring: false,
    backdrop: false,
  });
});

test("only an explicit true turns something on", () => {
  // These arrive from a jsonb column, so a stray string must not read as on.
  const loose = { avatarHero: "yes", avatarRing: 1, avatarBackdrop: "true" };
  const got = resolveAvatarPresentation(
    theme(loose as unknown as Partial<ProfileThemeConfig>),
    true,
  );
  assert.deepEqual(got, {
    hero: false,
    shape: undefined,
    ring: false,
    backdrop: false,
  });
});
