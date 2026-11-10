import { NextResponse } from "next/server";
import { retrieveCheckoutForm, verifyWebhookSignature } from "@/lib/iyzico";
import { processSuccessfulPayment } from "@/lib/payment-processor";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const signature = request.headers.get("x-iyz-signature-v3") ?? request.headers.get("x-iyz-signature");
  const token = typeof body.token === "string" ? body.token : "";
  const conversationId = typeof body.paymentConversationId === "string" ? body.paymentConversationId : "";
  const paymentId = typeof body.paymentId === "string" || typeof body.iyziPaymentId === "number"
    ? String(body.paymentId ?? body.iyziPaymentId)
    : "";

  // Eğer token varsa doğrudan iyzico sunucusundan sorgulayarak %100 doğrula
  if (token) {
    try {
      const result = await retrieveCheckoutForm(token);
      if (result.status === "success" && result.paymentStatus === "SUCCESS") {
        const orderId = String(result.basketId ?? result.conversationId ?? "");
        const paidKurus = Math.round(Number(result.paidPrice) * 100);
        await processSuccessfulPayment(orderId, String(result.paymentId ?? ""), paidKurus);
      }
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("Webhook token sorgu hatası:", e);
      return NextResponse.json({ error: "Sorgu hatası" }, { status: 500 });
    }
  }

  // Doğrudan ödeme bildirimi geldiyse imzayı doğrula ve işle
  if (signature && !verifyWebhookSignature(body as Record<string, string>, signature)) {
    return NextResponse.json({ error: "Geçersiz imza" }, { status: 401 });
  }

  if (body.status === "SUCCESS" && conversationId && paymentId) {
    const order = await prisma.order.findUnique({ where: { id: conversationId } });
    if (order) {
      await processSuccessfulPayment(order.id, paymentId, order.total);
    }
  }

  return NextResponse.json({ ok: true });
}