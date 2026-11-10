"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { requireSeller } from "@/lib/seller";
import { UPLOAD_URL_PATTERN } from "@/lib/uploads";

/* ---------- Mağaza açma ---------- */

export type StoreFormState =
  | { error?: string; storeName?: string; description?: string }
  | undefined;

export async function openStore(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const storeName = String(formData.get("storeName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (storeName.length < 3 || storeName.length > 40) {
    return { error: "Mağaza adı 3 ile 40 karakter arasında olmalı.", storeName, description };
  }
  if (description.length > 300) {
    return { error: "Açıklama en fazla 300 karakter olabilir.", storeName, description };
  }

  const already = await prisma.seller.findUnique({ where: { userId: user.id } });
  if (already) redirect("/satici");

  const taken = await prisma.seller.findUnique({ where: { storeName } });
  if (taken) {
    return { error: "Bu mağaza adı kullanılıyor. Başka bir ad dene.", storeName, description };
  }

  await prisma.seller.create({
    data: {
      storeName,
      description: description || null,
      approved: false, // yönetici onaylayana kadar yayında değil
      userId: user.id,
    },
  });
  if (user.role === "CUSTOMER") {
    await prisma.user.update({ where: { id: user.id }, data: { role: "SELLER" } });
  }

  revalidatePath("/", "layout");
  redirect("/satici");
}

/* ---------- Ürün ekleme / düzenleme ---------- */

export type ProductFormState =
  | {
      error?: string;
      values?: {
        title: string;
        description: string;
        price: string;
        stock: string;
        categoryId: string;
      };
    }
  | undefined;

// "129,90", "1.299,90", "129.90" ve "1.299" gibi yazımları kuruşa çevirir
function parsePrice(input: string): number | null {
  let s = input.replace(/[^\d.,]/g, "");
  if (!s) return null;

  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) return null;
  return Math.round(n * 100);
}

function slugify(text: string) {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
  };
  return (
    text
      .toLocaleLowerCase("tr-TR")
      .replace(/[çğıöşüâîû]/g, (c) => map[c])
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "urun"
  );
}

export async function saveProduct(
  productId: string | null,
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const { seller } = await requireSeller();

  const existing = productId
    ? await prisma.product.findFirst({
        where: { id: productId, sellerId: seller.id },
        include: { images: true },
      })
    : null;
  if (productId && !existing) redirect("/satici/urunler");

  const get = (key: string) => String(formData.get(key) ?? "").trim();
  const values = {
    title: get("title"),
    description: get("description"),
    price: get("price"),
    stock: get("stock"),
    categoryId: get("categoryId"),
  };
  const fail = (error: string): ProductFormState => ({ error, values });

  const price = parsePrice(values.price);
  const stock = Number(values.stock);

  // Sadece kendi yüklediğimiz görseller (ya da üründe zaten olanlar) kabul edilir
  const keep = new Set(existing?.images.map((i) => i.url) ?? []);
  const images = Array.from(new Set(formData.getAll("images").map(String))).filter(
    (u) => UPLOAD_URL_PATTERN.test(u) || keep.has(u)
  );

  if (values.title.length < 3 || values.title.length > 120) {
    return fail("Ürün adı 3 ile 120 karakter arasında olmalı.");
  }
  if (values.description.length < 10 || values.description.length > 2000) {
    return fail("Açıklama en az 10, en fazla 2000 karakter olmalı.");
  }
  if (price === null) return fail("Geçerli bir fiyat gir. Örnek: 129,90");
  if (values.stock === "" || !Number.isInteger(stock) || stock < 0 || stock > 100000) {
    return fail("Stok 0 ile 100000 arasında bir tam sayı olmalı.");
  }
  const category = await prisma.category.findUnique({ where: { id: values.categoryId } });
  if (!category) return fail("Bir kategori seç.");
  if (images.length === 0) return fail("En az bir görsel ekle.");
  if (images.length > 5) return fail("En fazla 5 görsel ekleyebilirsin.");

  const data = {
    title: values.title,
    description: values.description,
    price,
    stock,
    categoryId: category.id,
  };

  if (existing) {
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: existing.id } }),
      prisma.product.update({
        where: { id: existing.id },
        data: { ...data, images: { create: images.map((url) => ({ url })) } },
      }),
    ]);
  } else {
    await prisma.product.create({
      data: {
        ...data,
        slug: `${slugify(values.title)}-${randomBytes(3).toString("hex")}`,
        sellerId: seller.id,
        images: { create: images.map((url) => ({ url })) },
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/satici/urunler");
}

/* ---------- Yayından kaldır / yayına al ---------- */

export async function toggleProduct(productId: string) {
  const { seller } = await requireSeller();

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: seller.id },
  });
  if (!product) return;

  await prisma.product.update({
    where: { id: product.id },
    data: { active: !product.active },
  });
  revalidatePath("/", "layout");
}