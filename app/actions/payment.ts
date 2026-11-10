"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { initializeCheckoutForm, cancelPayment, toDecimal, toGsm } from "@/lib/iyzico";

export async function startPayment(orderId: string) {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { product: true } }, user: true },
  });
  if (!order) redirect("/");
  if (order.status !== "PENDING") redirect(`/siparis/${order.id}`);

  // Ödeme formunu açmadan hemen önce stokların hala yeterli olduğunu kontrol et
  for (const item of order.items) {
    if (!item.product.active || item.product.stock < item.quantity) {
      redirect(`/siparis/${order.id}?odeme=stok_yetersiz`);
    }
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "85.34.78.112";

  const parts = order.shippingName.split(/\s+/);
  const surname = parts.length > 1 ? parts.pop()! : parts[0];
  const name = parts.join(" ") || surname;

  const price = toDecimal(order.total);
  const address = {
    contactName: order.shippingName,
    city: order.shippingCity,
    country: "Turkey",
    address: `${order.shippingLine} ${order.shippingDistrict}`,
  };

  const request = {
    locale: "tr",
    conversationId: order.id,
    price,
    paidPrice: price,
    currency: "TRY",
    basketId: order.id,
    paymentGroup: "PRODUCT",
    callbackUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/api/odeme/callback`,
    enabledInstallments: [1],
    buyer: {
      id: order.userId,
      name,
      surname,
      gsmNumber: toGsm(order.shippingPhone),
      email: order.user.email,
      identityNumber: "11111111111",
      registrationAddress: order.shippingLine,
      ip,
      city: order.shippingCity,
      country: "Turkey",
    },
    shippingAddress: address,
    billingAddress: address,
    basketItems: order.items.map((i) => ({
      id: i.productId,
      name: `${i.title} x${i.quantity}`,
      category1: "Genel",
      itemType: "PHYSICAL",
      price: toDecimal(i.unitPrice * i.quantity),
    })),
  };

  let result;
  try {
    result = await initializeCheckoutForm(request);
  } catch (e) {
    console.error("iyzico bağlantı hatası:", e);
  }

  if (!result || result.status !== "success" || !result.paymentPageUrl) {
    console.error("iyzico başlatma hatası:", result?.errorCode, result?.errorMessage);
    redirect(`/siparis/${order.id}?odeme=hata`);
  }

  redirect(result.paymentPageUrl);
}

// Sipariş İptal ve Otomatik İade (Stokları geri yükler ve iyzico ödemesini iptal eder)
export async function cancelAndRefundOrder(orderId: string) {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });

  if (!order) redirect("/hesabim");

  // Sadece PENDING veya henüz kargoya verilmemiş PAID siparişler iptal edilebilir
  const anyShipped = order.items.some((i) => i.fulfillment !== "PREPARING");
  if ((order.status !== "PENDING" && order.status !== "PAID") || anyShipped) {
    redirect(`/siparis/${order.id}?iptal=hata`);
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "85.34.78.112";

  // Eğer sipariş ödendiyse önce iyzico üzerinden iade yap
  if (order.status === "PAID" && order.paymentRef) {
    try {
      const res = await cancelPayment(order.paymentRef, ip);
      if (res.status !== "success") {
        console.error("iyzico iptal hatası:", res.errorCode, res.errorMessage);
        redirect(`/siparis/${order.id}?iptal=iyzico_hata`);
      }
    } catch (e) {
      console.error("iyzico iptal bağlantı hatası:", e);
      redirect(`/siparis/${order.id}?iptal=iyzico_hata`);
    }
  }

  // Veritabanında siparişi CANCELLED yap ve ödenmişse düşülen stokları geri ekle
  await prisma.$transaction(async (tx) => {
    const fresh = await tx.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    if (!fresh || fresh.status === "CANCELLED") return;

    if (fresh.status === "PAID") {
      for (const item of fresh.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({
      where: { id: fresh.id },
      data: { status: "CANCELLED" },
    });
  });

  revalidatePath(`/siparis/${order.id}`);
  revalidatePath("/hesabim");
  redirect(`/siparis/${order.id}?iptal=basarili`);
}