/* eslint-disable @typescript-eslint/no-explicit-any */
import Iyzipay from "iyzipay";

function client() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const uri = process.env.IYZICO_BASE_URL;
  if (!apiKey || !secretKey || !uri) {
    throw new Error("iyzico ayarları .env dosyasında eksik.");
  }
  return new Iyzipay({ apiKey, secretKey, uri });
}

export function initializeCheckoutForm(request: any): Promise<any> {
  const iyzipay = client();
  return new Promise((resolve, reject) => {
    iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export function retrieveCheckoutForm(token: string): Promise<any> {
  const iyzipay = client();
  const request: any = { locale: "tr", token };
  return new Promise((resolve, reject) => {
    iyzipay.checkoutForm.retrieve(request, (err: any, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// kuruş -> "129.90" (iyzico tutarları metin olarak ve noktalı ister)
export function toDecimal(kurus: number) {
  return (kurus / 100).toFixed(2);
}

// 0532 123 45 67 -> +905321234567
export function toGsm(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+9${digits}`;
  if (digits.length === 10) return `+90${digits}`;
  return `+${digits}`;
}