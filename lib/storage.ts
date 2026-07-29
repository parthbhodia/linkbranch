export const PUBLIC_ASSET_BUCKET = "avatars";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function publicAssetUrl(path?: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl || !path) {
    return undefined;
  }

  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/storage/v1/object/public/${PUBLIC_ASSET_BUCKET}/${encodedPath}`;
}

export function validateImage(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
    return "Use a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "Keep images under 5 MB.";
  }

  return null;
}

export function imageExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export const MAX_FAVICON_BYTES = 1024 * 1024;
export const SUPPORTED_FAVICON_TYPES = [
  "image/png",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/jpeg",
  "image/webp",
] as const;

export function validateFavicon(file: File) {
  if (
    !SUPPORTED_FAVICON_TYPES.includes(
      file.type as (typeof SUPPORTED_FAVICON_TYPES)[number],
    )
  ) {
    return "Use a PNG, ICO, JPG, or WebP favicon.";
  }

  if (file.size > MAX_FAVICON_BYTES) {
    return "Keep favicons under 1 MB.";
  }

  return null;
}

export function faviconExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (
    file.type === "image/x-icon" ||
    file.type === "image/vnd.microsoft.icon"
  ) {
    return "ico";
  }
  return "jpg";
}
