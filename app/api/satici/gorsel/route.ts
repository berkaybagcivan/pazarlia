import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import {
  UPLOAD_DIR,
  MAX_IMAGE_BYTES,
  detectImageType,
  uploadToCloud,
} from "@/lib/uploads";

export async function POST(request: Request) {
  const userId = await getUserId();
  const seller = userId
    ? await prisma.seller.findUnique({ where: { userId } })
    : null;
  if (!seller) {
    return NextResponse.json(
      { error: "Görsel yüklemek için mağaza sahibi olmalısın." },
      { status: 403 }
    );
  }

    if (!seller.approved) {
    return NextResponse.json(
      { error: "Mağazan onaylandıktan sonra görsel yükleyebilirsin." },
      { status: 403 }
    );
  }

  let file: FormDataEntryValue | null = null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    // aşağıda ele alınıyor
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Görsel en fazla 4 MB olabilir." },
      { status: 413 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) {
    return NextResponse.json(
      { error: "Sadece JPG, PNG veya WebP yükleyebilirsin." },
      { status: 415 }
    );
  }

  // 1. Bulut depolama (Cloudinary) ayarlıysa oraya yükle
  try {
    const cloudUrl = await uploadToCloud(bytes, type);
    if (cloudUrl) {
      return NextResponse.json({ url: cloudUrl });
    }
  } catch (e) {
    console.error("Bulut yükleme hatası:", e);
    return NextResponse.json(
      { error: "Görsel bulut sunucusuna yüklenemedi." },
      { status: 500 }
    );
  }

  // 2. Canlıda yerel diske yazılamaz, ayar eksikse net bir hata ver
  if (process.env.NODE_ENV === "production") {
    console.error("Cloudinary ayarları eksik, görsel kaydedilemedi.");
    return NextResponse.json(
      { error: "Görsel depolama ayarlı değil. Lütfen site yöneticisine haber ver." },
      { status: 500 }
    );
  }

  // 3. Geliştirme: yerel klasöre kaydet
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${type}`;
  await writeFile(path.join(UPLOAD_DIR, name), bytes);

  return NextResponse.json({ url: `/uploads/${name}` });
}