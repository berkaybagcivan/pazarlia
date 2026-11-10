import crypto from "crypto";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Vercel fonksiyonlarının 4,5 MB istek sınırının altında kalır
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const CONTENT_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

const LOCAL_URL = /^\/uploads\/[a-f0-9-]{36}\.(jpg|png|webp)$/;

// Sadece kendi yüklediğimiz görsellerin adreslerini kabul eder
export function isAllowedImageUrl(url: string) {
  if (LOCAL_URL.test(url)) return true;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  return !!cloud && url.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`);
}

// Dosya adına ya da tarayıcının söylediğine değil, dosyanın gerçek içeriğine (magic bytes) bakar
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

// Bulut depolama (Cloudinary) aktifse oraya yükler, değilse null döner
export async function uploadToCloud(
  bytes: Uint8Array,
  type: keyof typeof CONTENT_TYPES
): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "pazarlia";
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  const base64Data = `data:${CONTENT_TYPES[type]};base64,${Buffer.from(bytes).toString("base64")}`;

  const form = new FormData();
  form.append("file", base64Data);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudinary yükleme hatası: ${errText}`);
  }

  const data = (await res.json()) as { secure_url: string };
  return data.secure_url;
}