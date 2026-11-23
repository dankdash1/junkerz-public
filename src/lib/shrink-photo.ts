// Client-side photo shrink before upload. Phones take 4-12 MB photos (and
// HEIC on iPhone); the backend accepts only JPEG/PNG/WebP up to 8 MB, so we
// re-encode big or unusual images to a 2048 px JPEG in the browser. Anything
// we cannot decode is returned untouched: never block the seller.

export const SHRINK_OVER_BYTES = 2.5 * 1024 * 1024;
export const UPLOAD_LIMIT_BYTES = 8 * 1024 * 1024;
const STEP_DOWN_OVER_BYTES = 7 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const HEIC_EXT = /\.(heic|heif)$/i;
const ATTEMPTS: ReadonlyArray<{ longSide: number; quality: number }> = [
  { longSide: 2048, quality: 0.82 },
  { longSide: 1600, quality: 0.6 },
];

function isImage(file: File): boolean {
  return file.type.startsWith("image/") || HEIC_EXT.test(file.name);
}

/** True when the file is an image we should re-encode before upload. */
export function needsShrink(file: File): boolean {
  if (!isImage(file)) return false; // PDFs and other documents pass through
  if (!ALLOWED_TYPES.has(file.type.toLowerCase())) return true; // HEIC/HEIF/GIF/unknown
  return file.size > SHRINK_OVER_BYTES;
}

/** Original name with a .jpg extension. */
export function jpegName(name: string): string {
  const base = (name || "photo").replace(/\.[^./\\]+$/, "");
  return `${base || "photo"}.jpg`;
}

/** "11.2 MB" (one decimal, MiB like the server limit). */
export function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Safari may decode HEIC only through <img>; fall through.
    }
  }
  if (typeof Image === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) {
    throw new Error("no_decoder");
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode_failed"));
      img.src = url;
    });
    if (!img.naturalWidth || !img.naturalHeight) throw new Error("decode_failed");
    // Modern browsers apply EXIF orientation to <img> by default.
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function encode(image: Decoded, longSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, longSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("no_canvas"));
  ctx.fillStyle = "#fff"; // PNG transparency becomes white, not black
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image.source, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob && blob.size ? resolve(blob) : reject(new Error("encode_failed"))), "image/jpeg", quality);
  });
}

/**
 * Return a JPEG copy of a big or non-JPEG/PNG/WebP image, long side <= 2048 px
 * (1600 px / q0.6 if still over 7 MB). PDFs and small allowed images come back
 * as-is; so does anything the browser cannot decode.
 */
export async function shrinkPhoto(file: File): Promise<File> {
  if (!needsShrink(file)) return file;
  let image: Decoded | null = null;
  try {
    image = await decode(file);
    let blob: Blob | null = null;
    for (const { longSide, quality } of ATTEMPTS) {
      blob = await encode(image, longSide, quality);
      if (blob.size <= STEP_DOWN_OVER_BYTES) break;
    }
    if (!blob) return file;
    // A small allowed image that somehow grew: keep the original.
    if (ALLOWED_TYPES.has(file.type.toLowerCase()) && blob.size >= file.size) return file;
    return new File([blob], jpegName(file.name), { type: "image/jpeg", lastModified: file.lastModified || Date.now() });
  } catch {
    return file;
  } finally {
    image?.close();
  }
}

/** Shrink every non-empty image File entry in a FormData in place (one file per field). */
export async function shrinkFormDataPhotos(fields: FormData): Promise<void> {
  for (const [key, value] of Array.from(fields.entries())) {
    if (value instanceof File && value.name && needsShrink(value)) {
      fields.set(key, await shrinkPhoto(value));
    }
  }
}

/** Largest File in a FormData, or null. */
export function largestFile(fields: FormData): File | null {
  let largest: File | null = null;
  for (const [, value] of Array.from(fields.entries())) {
    if (value instanceof File && value.name && (!largest || value.size > largest.size)) largest = value;
  }
  return largest;
}
