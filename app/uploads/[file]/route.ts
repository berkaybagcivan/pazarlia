import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR, CONTENT_TYPES } from "@/lib/uploads";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  // Sadece kendi ürettiğimiz dosya adlarına izin verilir (klasör dışına çıkılamaz)
  const match = /^[a-f0-9-]{36}\.(jpg|png|webp)$/.exec(file);
  if (!match) return new Response("Bulunamadı", { status: 404 });

  try {
    const data = await readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": CONTENT_TYPES[match[1] as keyof typeof CONTENT_TYPES],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Bulunamadı", { status: 404 });
  }
}