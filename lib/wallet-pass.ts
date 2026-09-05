/**
 * Apple Wallet pass generation.
 *
 * The pass carries the same URL the /card screen encodes, so a scanner cannot
 * tell which surface the code came from. That is the point: this is an extra
 * way to reach your code, not a second version of it.
 *
 * Why it is worth having alongside /card, on Apple's own numbers: the pkpass
 * format shipped in iOS 6 and has stayed compatible since, so this opens on
 * essentially every iPhone still in use -- including the older handsets where
 * the Screen Wake Lock API /card relies on does not exist. Wallet also forces
 * the screen to maximum brightness for a barcode pass, which is the one thing
 * a web page structurally cannot do, and syncs to Apple Watch for free.
 *
 * These passes are static. There is no update web service, so a pass reflects
 * the profile as it was when it was downloaded -- see docs in the README.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PKPass } from "passkit-generator";

export type WalletPassInput = {
  profileId: string;
  displayName: string;
  username: string;
  jobTitle?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  profileUrl: string;
  /** `#rrggbb`; Wallet wants `rgb(r, g, b)`, so these get converted. */
  backgroundColor?: string | null;
  foregroundColor?: string | null;
};

const IMAGE_DIR = path.join(process.cwd(), "assets", "wallet");

/** Apple rejects a pass with no icon, so these are not optional. */
const PASS_IMAGES = [
  "icon.png",
  "icon@2x.png",
  "icon@3x.png",
  "logo.png",
  "logo@2x.png",
] as const;

export type WalletConfig = {
  passTypeIdentifier: string;
  teamIdentifier: string;
  signerCert: Buffer;
  signerKey: Buffer;
  signerKeyPassphrase?: string;
  wwdr: Buffer;
};

function decode(value: string | undefined) {
  if (!value) return undefined;
  return Buffer.from(value, "base64");
}

/**
 * Reads signing material from the environment. Returns null rather than
 * throwing when nothing is configured: a deployment without Apple credentials
 * is the normal state for local development and for previews, and it should
 * degrade to "no Wallet button" rather than to a crash.
 *
 * PEMs are base64-encoded because they are multi-line and platform env vars
 * are single-line strings.
 */
export function readWalletConfig(): WalletConfig | null {
  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_ID;
  const teamIdentifier = process.env.APPLE_TEAM_ID;
  const signerCert = decode(process.env.APPLE_PASS_SIGNER_CERT_BASE64);
  const signerKey = decode(process.env.APPLE_PASS_SIGNER_KEY_BASE64);
  const wwdr = decode(process.env.APPLE_WWDR_CERT_BASE64);

  if (!passTypeIdentifier || !teamIdentifier || !signerCert || !signerKey || !wwdr) {
    return null;
  }

  return {
    passTypeIdentifier,
    teamIdentifier,
    signerCert,
    signerKey,
    signerKeyPassphrase: process.env.APPLE_PASS_SIGNER_KEY_PASSPHRASE,
    wwdr,
  };
}

/** `#1d4ed8` -> `rgb(29, 78, 216)`. Wallet accepts no other colour syntax. */
function toRgb(hex: string | null | undefined, fallback: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!match) return fallback;
  const int = Number.parseInt(match[1], 16);
  return `rgb(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255})`;
}

/**
 * Wallet truncates rather than wraps, and a field that runs off the card reads
 * as a bug. Cutting at a word boundary keeps it looking deliberate.
 */
function clamp(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${space > max * 0.6 ? cut.slice(0, space) : cut}…`;
}

async function loadImages() {
  const entries = await Promise.all(
    PASS_IMAGES.map(
      async (name) => [name, await readFile(path.join(IMAGE_DIR, name))] as const,
    ),
  );
  return Object.fromEntries(entries) as Record<string, Buffer>;
}

export async function buildWalletPass(
  input: WalletPassInput,
  config: WalletConfig,
): Promise<Buffer> {
  const pass = new PKPass(
    await loadImages(),
    {
      wwdr: config.wwdr,
      signerCert: config.signerCert,
      signerKey: config.signerKey,
      signerKeyPassphrase: config.signerKeyPassphrase,
    },
    {
      // A business card is none of Apple's transactional styles, so `generic`
      // is the correct one rather than a fallback.
      description: `${input.displayName} — digital business card`,
      organizationName: "Cueful",
      passTypeIdentifier: config.passTypeIdentifier,
      teamIdentifier: config.teamIdentifier,
      // Stable per profile. It carries no meaning today, but an update web
      // service would key on it, so churning it now would orphan every pass
      // already in circulation.
      serialNumber: input.profileId,
      logoText: "Cueful",
      backgroundColor: toRgb(input.backgroundColor, "rgb(17, 17, 19)"),
      foregroundColor: toRgb(input.foregroundColor, "rgb(255, 255, 255)"),
      labelColor: toRgb(input.foregroundColor, "rgb(255, 255, 255)"),
    },
  );

  pass.type = "generic";

  pass.primaryFields.push({
    key: "name",
    label: "",
    value: clamp(input.displayName, 40),
  });

  if (input.jobTitle) {
    pass.secondaryFields.push({
      key: "role",
      label: "ROLE",
      value: clamp(input.jobTitle, 40),
    });
  }

  if (input.company) {
    pass.secondaryFields.push({
      key: "company",
      label: "COMPANY",
      value: clamp(input.company, 40),
    });
  }

  pass.auxiliaryFields.push({
    key: "handle",
    label: "PAGE",
    value: `@${input.username}`,
  });

  // Everything reachable rather than scannable lives on the back, where there
  // is room for it and where tapping is expected.
  if (input.email) {
    pass.backFields.push({ key: "email", label: "Email", value: input.email });
  }

  if (input.phone) {
    pass.backFields.push({ key: "phone", label: "Phone", value: input.phone });
  }

  if (input.bio) {
    pass.backFields.push({ key: "bio", label: "About", value: clamp(input.bio, 300) });
  }

  pass.backFields.push({
    key: "profile",
    label: "Full page",
    value: input.profileUrl,
  });

  // Said plainly on the pass itself rather than only in the docs: without an
  // update service, an edited profile does not reach a pass already saved.
  pass.backFields.push({
    key: "refresh",
    label: "Changed your details?",
    value: `Edit your page, then download the card again from ${input.profileUrl.replace(
      /\/u\/.*$/,
      "/card",
    )}`,
  });

  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: input.profileUrl,
    // Wallet's documented encoding for QR payloads. UTF-8 is silently rejected
    // by some scanners; the URL is ASCII either way.
    messageEncoding: "iso-8859-1",
    altText: `@${input.username}`,
  });

  return pass.getAsBuffer();
}

/** `alex-curates.pkpass` -- Wallet shows the filename while importing. */
export function walletPassFilename(username: string) {
  const safe = username.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  return `${safe || "cueful-card"}.pkpass`;
}
