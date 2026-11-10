import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { retrieveCheckoutForm } from "@/lib/iyzico";

export async function POST(request: Request) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const go = (path: string) => NextResponse.redirect(new URL(path, base), 303);

  const form = await request.formData();
  const token = String(form.get("token") ?? "");
  if (!token) return go("/");

  let result;
  try {
    result = await retrieveCheckoutForm(token);
  } catch (e) {
    console.error("iyzico sonuç sorgu hatası:", e);
    return go("/");
  }

  const orderId = String(result?.basketId ?? result?.conversationId ?? "");
  const order = orderId
    ? await prisma.order.findUnique({ where: { id: orderId } })
    : null;
  if (!order) return go("/");

  const paid =
    result.status === "success" &&
    result.paymentStatus === "SUCCESS" &&
    Math.round(Number(result.paidPrice) * 100) === order.total;

  if (!paid) {
    console.error("Ödeme başarısız:", result.paymentStatus, result.errorCode, result.errorMessage);
    return go(`/siparis/${order.id}?odeme=hata`);
  }

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    if (!fresh || fresh.status !== "PENDING") return; // zaten işlenmiş

    for (const item of fresh.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        userId: fresh.userId,
        productId: { in: fresh.items.map((i) => i.productId) },
      },
    });

    await tx.order.update({
      where: { id: fresh.id },
      data: { status: "PAID", paymentRef: String(result.paymentId ?? "") },
    });
  });

  return go(`/siparis/${order.id}?odeme=basarili`);
}