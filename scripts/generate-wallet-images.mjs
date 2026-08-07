// Generates the image set a .pkpass bundle requires, from the same 512px
// monogram the PWA icons come from, so the Wallet pass and the installed app
// carry the same mark.
//
// Apple requires icon.png -- a pass without it fails validation on device
// rather than at build time, which is a slow way to find out. logo.png sits in
// the pass header beside logoText.
//
// Run with: node scripts/generate-wallet-images.mjs

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = path.join(process.cwd(), "public", "icon-512.png");
const OUT_DIR = path.join(process.cwd(), "assets", "wallet");

// Apple specifies these in points; @2x is the retina variant. The icon is what
// Wallet shows in the pass list and on the lock screen, so it is the one that
// has to be crisp.
const TARGETS = [
  { name: "icon.png", size: 29 },
  { name: "icon@2x.png", size: 58 },
  { name: "icon@3x.png", size: 87 },
  { name: "logo.png", size: 50 },
  { name: "logo@2x.png", size: 100 },
];

await mkdir(OUT_DIR, { recursive: true });

for (const { name, size } of TARGETS) {
  const out = path.join(OUT_DIR, name);
  await sharp(SOURCE)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`${name.padEnd(14)} ${size}x${size}`);
}

console.log(`\nWrote ${TARGETS.length} files to ${path.relative(process.cwd(), OUT_DIR)}`);
