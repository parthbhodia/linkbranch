import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WALLPAPER_MAX_EDGE,
  formatBytes,
  planWallpaperResize,
  wallpaperInputError,
  wallpaperOutputError,
  wallpaperWarnings,
} from "./wallpaper.ts";

describe("planWallpaperResize", () => {
  it("leaves an image within the limit alone", () => {
    assert.deepEqual(planWallpaperResize(1080, 1920), { width: 1080, height: 1920, scaled: false });
  });

  it("shrinks the longest edge to the limit and keeps the ratio", () => {
    const plan = planWallpaperResize(3000, 4000);
    assert.equal(plan.height, WALLPAPER_MAX_EDGE);
    assert.equal(plan.width, 1800);
    assert.equal(plan.scaled, true);
  });

  it("handles landscape the same way", () => {
    assert.deepEqual(planWallpaperResize(4000, 2000), { width: 2400, height: 1200, scaled: true });
  });
});

describe("wallpaperWarnings", () => {
  it("says nothing about a good portrait image", () => {
    assert.deepEqual(wallpaperWarnings(1080, 1920), []);
  });

  it("warns about landscape", () => {
    const [warning] = wallpaperWarnings(1920, 1080);
    assert.match(warning, /Landscape/);
  });

  it("warns about a small image", () => {
    const warnings = wallpaperWarnings(600, 900);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /Small image \(600 × 900\)/);
  });

  it("can warn about both at once", () => {
    assert.equal(wallpaperWarnings(640, 480).length, 2);
  });
});

describe("wallpaperInputError", () => {
  it("accepts a normal photo", () => {
    assert.equal(wallpaperInputError({ type: "image/jpeg", size: 8_000_000 }), null);
  });

  it("explains HEIC by type or by name", () => {
    assert.match(wallpaperInputError({ type: "image/heic", size: 1 }) ?? "", /HEIC/);
    assert.match(wallpaperInputError({ type: "", size: 1, name: "IMG_0042.HEIC" }) ?? "", /HEIC/);
  });

  it("rejects other types and oversized input", () => {
    assert.match(wallpaperInputError({ type: "image/gif", size: 1 }) ?? "", /JPG, PNG or WebP/);
    assert.match(wallpaperInputError({ type: "image/png", size: 31 * 1024 * 1024 }) ?? "", /30 MB/);
  });
});

describe("wallpaperOutputError / formatBytes", () => {
  it("only complains above five megabytes", () => {
    assert.equal(wallpaperOutputError(5 * 1024 * 1024), null);
    assert.match(wallpaperOutputError(5 * 1024 * 1024 + 1) ?? "", /over 5 MB/);
  });

  it("formats sizes for people", () => {
    assert.equal(formatBytes(900), "1 KB");
    assert.equal(formatBytes(640 * 1024), "640 KB");
    assert.equal(formatBytes(2.5 * 1024 * 1024), "2.5 MB");
  });
});
