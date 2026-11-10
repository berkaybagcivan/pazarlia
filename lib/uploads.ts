import path from "path";

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const UPLOAD_URL_PATTERN = /^\/uploads\/[a-f0-9-]{36}\.(jpg|png|webp)$/;

export const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

// Dosya adına ya da tarayıcının söylediği türe değil, dosyanın gerçek içeriğine bakar
export function detectImageType(b: Uint8Array): keyof typeof CONTENT_TYPES | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "png";
  }
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}