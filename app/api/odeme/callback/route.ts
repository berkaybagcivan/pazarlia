import { NextResponse } from "next/server";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { processSuccessfulPayment } from "@/lib/payment-processor";

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
  if (!orderId) return go("/");

  if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
    console.error("Ödeme başarısız:", result.paymentStatus, result.errorCode, result.errorMessage);
    return go(`/siparis/${orderId}?odeme=hata`);
  }

  const paidKurus = Math.round(Number(result.paidPrice) * 100);
  const paymentId = String(result.paymentId ?? "");

  const outcome = await processSuccessfulPayment(orderId, paymentId, paidKurus);

  if (outcome.status === "OUT_OF_STOCK_REFUNDED") {
    return go(`/siparis/${orderId}?odeme=stok_bitti_iade`);
  }

  if (outcome.status === "INVALID") {
    return go(`/siparis/${orderId}?odeme=hata`);
  }

  return go(`/siparis/${orderId}?odeme=basarili`);
}