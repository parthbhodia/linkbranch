/**
 * Browser-only half of the wallpaper rules: decode the chosen file, shrink it
 * if it is larger than a phone can use, and hand back something to preview
 * and upload. Kept apart from lib/wallpaper.ts so the pure rules stay
 * testable under node.
 */

import {
  WALLPAPER_REENCODE_BYTES,
  planWallpaperResize,
  wallpaperInputError,
  wallpaperOutputError,
  wallpaperWarnings,
  type PreparedWallpaper,
} from "@/lib/wallpaper";

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // from-image applies the EXIF rotation phones write, so a portrait photo
  // does not arrive sideways. Older Safari rejects the option; fall through.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // continue
  }
  try {
    return await createImageBitmap(file);
  } catch {
    // continue
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    image.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareWallpaper(file: File): Promise<PreparedWallpaper> {
  const inputError = wallpaperInputError(file);
  if (inputError) throw new Error(inputError);

  const source = await decode(file);
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!width || !height) throw new Error("That file could not be read as an image.");

  const plan = planWallpaperResize(width, height);
  let output: Blob = file;
  let reencoded = false;

  if (plan.scaled || file.size > WALLPAPER_REENCODE_BYTES) {
    const canvas = document.createElement("canvas");
    canvas.width = plan.width;
    canvas.height = plan.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not process the image.");
    context.drawImage(source, 0, 0, plan.width, plan.height);
    // WebP is a third the size of JPEG at the same quality and every current
    // browser writes it; the JPEG path is for the odd one that does not.
    const encoded =
      (await toBlob(canvas, "image/webp", 0.85)) ?? (await toBlob(canvas, "image/jpeg", 0.86));
    if (!encoded) throw new Error("This browser could not process the image.");
    output = encoded;
    reencoded = true;
  }

  if ("close" in source) source.close();

  const outputError = wallpaperOutputError(output.size);
  if (outputError) throw new Error(outputError);

  const extension =
    output.type === "image/webp" ? "webp" : output.type === "image/png" ? "png" : "jpg";
  const prepared = new File([output], `wallpaper.${extension}`, { type: output.type });

  return {
    file: prepared,
    previewUrl: URL.createObjectURL(prepared),
    width: plan.width,
    height: plan.height,
    originalBytes: file.size,
    bytes: prepared.size,
    scaled: plan.scaled,
    reencoded,
    warnings: wallpaperWarnings(plan.width, plan.height),
  };
}

export function releaseWallpaper(prepared: PreparedWallpaper | null) {
  if (prepared) URL.revokeObjectURL(prepared.previewUrl);
}
