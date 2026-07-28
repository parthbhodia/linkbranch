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
