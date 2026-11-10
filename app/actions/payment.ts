"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { initializeCheckoutForm, toDecimal, toGsm } from "@/lib/iyzico";

export async function startPayment(orderId: string) {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true, user: true },
  });
  if (!order) redirect("/");
  if (order.status !== "PENDING") redirect(`/siparis/${order.id}`);

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
      identityNumber: "11111111111", // sandbox test değeri
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