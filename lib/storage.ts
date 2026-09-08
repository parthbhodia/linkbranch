export const PUBLIC_ASSET_BUCKET = "avatars";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function publicAssetUrl(path?: string | null) {
  if (!path) {
    return undefined;
  }

  // Absolute or app-public paths (example profiles, marketing assets).
  if (
    path.startsWith("/") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
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

/**
 * Résumés live apart from the image assets. The bucket is private, so nothing
 * here builds a public URL -- /api/resume/<username> mints a signed one that
 * expires. A CV usually carries a phone number and often a home address, which
 * is more than belongs at a permanent, crawlable address.
 */
export const DOCUMENTS_BUCKET = "documents";
export const MAX_RESUME_BYTES = 10 * 1024 * 1024;
export const SUPPORTED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function validateResume(file: File) {
  if (
    !SUPPORTED_RESUME_TYPES.includes(
      file.type as (typeof SUPPORTED_RESUME_TYPES)[number],
    )
  ) {
    // Some browsers hand back application/octet-stream for a .docx, so the
    // extension is worth a second look before refusing an honest upload.
    const looksRight = /\.(pdf|docx)$/i.test(file.name);
    if (!looksRight) return "Use a PDF or Word (.docx) file.";
  }

  if (file.size > MAX_RESUME_BYTES) {
    return "Keep your résumé under 10 MB.";
  }

  return null;
}

export function resumeExtension(file: File) {
  if (file.type === "application/pdf") return "pdf";
  if (/\.pdf$/i.test(file.name)) return "pdf";
  return "docx";
}

/** The type the bucket will accept, even when the browser guessed wrong. */
export function resumeContentType(file: File) {
  return resumeExtension(file) === "pdf"
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}
