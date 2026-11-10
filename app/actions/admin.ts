"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";

export type CategoryState = { error?: string; name?: string } | undefined;

function readName(raw: FormDataEntryValue | null) {
  const name = String(raw ?? "").trim();
  return { name, ok: name.length >= 2 && name.length <= 40 };
}

/* ---------- Mağaza onayı ---------- */

export async function setSellerApproved(sellerId: string, approved: boolean) {
  await requireAdmin();
  await prisma.seller.updateMany({ where: { id: sellerId }, data: { approved } });
  revalidatePath("/", "layout");
}

/* ---------- Kategoriler ---------- */

export async function createCategory(
  _prev: CategoryState,
  formData: FormData
): Promise<CategoryState> {
  await requireAdmin();

  const { name, ok } = readName(formData.get("name"));
  if (!ok) {
    return { error: "Kategori adı 2 ile 40 karakter arasında olmalı.", name };
  }
  if (await prisma.category.findFirst({ where: { name } })) {
    return { error: "Bu isimde bir kategori zaten var.", name };
  }

  const base = slugify(name);
  let slug = base;
  for (let n = 2; await prisma.category.findUnique({ where: { slug } }); n++) {
    slug = `${base}-${n}`;
  }

  await prisma.category.create({ data: { name, slug } });
  revalidatePath("/", "layout");
  return undefined;
}

export async function renameCategory(
  categoryId: string,
  _prev: CategoryState,
  formData: FormData
): Promise<CategoryState> {
  await requireAdmin();

  const { name, ok } = readName(formData.get("name"));
  if (!ok) {
    return { error: "Kategori adı 2 ile 40 karakter arasında olmalı.", name };
  }
  if (await prisma.category.findFirst({ where: { name, NOT: { id: categoryId } } })) {
    return { error: "Bu isimde başka bir kategori var.", name };
  }

  // Adres (slug) değişmez, böylece eski bağlantılar çalışmaya devam eder
  await prisma.category.updateMany({ where: { id: categoryId }, data: { name } });
  revalidatePath("/", "layout");
  return undefined;
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();

  // Ürünü olan kategori silinemez, geçmiş siparişler ve ürünler bozulmasın
  const used = await prisma.product.count({ where: { categoryId } });
  const children = await prisma.category.count({ where: { parentId: categoryId } });
  if (used > 0 || children > 0) return;

  await prisma.category.deleteMany({ where: { id: categoryId } });
  revalidatePath("/", "layout");
}