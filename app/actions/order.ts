"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

export type CheckoutState = { error?: string } | undefined;

export async function createOrder(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const get = (key: string) => String(formData.get(key) ?? "").trim();
  const shippingName = get("fullName");
  const shippingPhone = get("phone").replace(/\s/g, "");
  const shippingCity = get("city");
  const shippingDistrict = get("district");
  const shippingLine = get("line");

  if (!shippingName || !shippingCity || !shippingDistrict || shippingLine.length < 10) {
    return { error: "Lütfen tüm adres alanlarını eksiksiz doldurun." };
  }
  if (!/^[0-9+]{10,14}$/.test(shippingPhone)) {
    return { error: "Geçerli bir telefon numarası girin." };
  }

    const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { seller: true } } },
  });
  if (items.length === 0) redirect("/sepet");

  for (const item of items) {
    if (!item.product.active || !item.product.seller.approved) {
      return {
        error: `“${item.product.title}” artık satışta değil. Sepetinden çıkarıp tekrar dene.`,
      };
    }
    if (item.product.stock < item.quantity) {
      return {
        error: `“${item.product.title}” için yeterli stok yok. Sepetini güncelle.`,
      };
    }
  }

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      total,
      shippingName,
      shippingPhone,
      shippingCity,
      shippingDistrict,
      shippingLine,
      userId,
      items: {
        create: items.map((i) => ({
          quantity: i.quantity,
          unitPrice: i.product.price,
          title: i.product.title,
          productId: i.productId,
          sellerId: i.product.sellerId,
        })),
      },
    },
  });

  redirect(`/siparis/${order.id}`);
}