/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";

function getConfig() {
  const apiKey = (process.env.IYZICO_API_KEY ?? "").trim();
  const secretKey = (process.env.IYZICO_SECRET_KEY ?? "").trim();
  const uri = (process.env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com")
    .trim()
    .replace(/\/+$/, "");

  if (!apiKey || !secretKey || !uri) {
    throw new Error("iyzico ayarları .env dosyasında eksik.");
  }
  return { apiKey, secretKey, uri };
}

// İyzico IYZWSv2 HMAC-SHA256 Authorization Header Üretici (Serverless & Turbopack %100 Uyumlu)
async function iyzicoPost(path: string, bodyObj: any): Promise<any> {
  const { apiKey, secretKey, uri } = getConfig();
  const randomKey = `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  const bodyJson = JSON.stringify(bodyObj);

  const payload = `${randomKey}${path}${bodyJson}`;
  const encryptedData = crypto
    .createHmac("sha256", secretKey)
    .update(payload, "utf8")
    .digest("hex");

  const authString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${encryptedData}`;
  const base64Auth = Buffer.from(authString, "utf8").toString("base64");

  const res = await fetch(`${uri}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `IYZWSv2 ${base64Auth}`,
      "x-iyzi-rnd": randomKey,
      "x-iyzi-client-version": "iyzipay-node-2.0.61",
    },
    body: bodyJson,
    cache: "no-store",
  });

  return res.json();
}

export async function initializeCheckoutForm(request: any): Promise<any> {
  return iyzicoPost("/payment/iyzipos/checkoutform/initialize/auth/ecom", request);
}

export async function retrieveCheckoutForm(token: string): Promise<any> {
  return iyzicoPost("/payment/iyzipos/checkoutform/auth/ecom/detail", {
    locale: "tr",
    token,
  });
}

// Tam sipariş iptali (aynı gün içinde tüm tutarı anında iade eder)
export async function cancelPayment(
  paymentId: string,
  ip: string = "85.34.78.112"
): Promise<any> {
  return iyzicoPost("/payment/cancel", {
    locale: "tr",
    conversationId: paymentId,
    paymentId,
    ip,
  });
}

// iyzico Webhook HMAC-SHA256 imza doğrulaması
export function verifyWebhookSignature(
  payload: {
    iyziEventType?: string;
    paymentId?: string;
    paymentConversationId?: string;
    status?: string;
    token?: string;
  },
  signature: string | null
): boolean {
  const secretKey = (process.env.IYZICO_SECRET_KEY ?? "").trim();
  if (!secretKey || !signature) return false;

  const key = `${secretKey}${payload.iyziEventType ?? ""}${payload.paymentId ?? payload.token ?? ""}${payload.paymentConversationId ?? ""}${payload.status ?? ""}`;
  const expected = crypto.createHmac("sha256", secretKey).update(key).digest("hex");
  return expected === signature;
}

// kuruş -> "129.90"
export function toDecimal(kurus: number) {
  return (kurus / 100).toFixed(2);
}

// 0532 123 45 67 -> +905321234567
export function toGsm(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+9${digits}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+905321234567`;
}