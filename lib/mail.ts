import nodemailer from "nodemailer";
import { formatPrice } from "@/lib/format";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

async function sendMail({
  to,
  subject,
  html,
  fallbackUrl,
}: {
  to: string;
  subject: string;
  html: string;
  fallbackUrl: string;
}) {
  const smtpUser = (process.env.SMTP_USER ?? "").trim();
  const smtpPass = (process.env.SMTP_PASS ?? "").replace(/\s+/g, "");

  // 1. Gmail SMTP ayarlıysa Port 465 (SSL) üzerinden gerçek e-posta gönder
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Pazarlia" <${smtpUser}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ E-posta başarıyla gönderildi: ${to} (${subject})`);
      return;
    } catch (e) {
      console.error("❌ SMTP e-posta gönderim hatası:", e);
    }
  }

  // 2. Resend API ayarlıysa Resend üzerinden gönder
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Pazarlia <onboarding@resend.dev>";

  if (apiKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      return;
    } catch (e) {
      console.error("Resend e-posta gönderim hatası:", e);
    }
  }

  // 3. Hiçbiri ayarlı değilse CMD ekranına yazdır
  console.log("\n==========================================");
  console.log(`📧 [GELİŞTİRME E-POSTASI] Alıcı: ${to}`);
  console.log(`Konu: ${subject}`);
  console.log(`Bağlantı: ${fallbackUrl}`);
  console.log("==========================================\n");
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify?token=${token}`;
  await sendMail({
    to: email,
    subject: "Pazarlia - E-posta Adresini Doğrula",
    fallbackUrl: url,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:16px">
        <h2 style="color:#111;margin-top:0">Pazarlia'ya Hoş Geldin!</h2>
        <p style="color:#444;line-height:1.5">E-posta adresini doğrulamak için aşağıdaki butona tıkla:</p>
        <p style="margin:24px 0">
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#ff5a36;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold">E-postamı Doğrula</a>
        </p>
        <p style="font-size:12px;color:#888">Bu bağlantı 24 saat geçerlidir.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/sifre-yenile/${token}`;
  await sendMail({
    to: email,
    subject: "Pazarlia - Şifre Sıfırlama İsteği",
    fallbackUrl: url,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:16px">
        <h2 style="color:#111;margin-top:0">Şifre Sıfırlama</h2>
        <p style="color:#444;line-height:1.5">Hesabının şifresini yenilemek için aşağıdaki butona tıkla:</p>
        <p style="margin:24px 0">
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#ff5a36;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold">Yeni Şifre Belirle</a>
        </p>
        <p style="font-size:12px;color:#888">Bu bağlantı 1 saat geçerlidir. İsteği sen yapmadıysan bu e-postayı görmezden gelebilirsin.</p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail({
  email,
  orderId,
  shippingName,
  total,
  items,
}: {
  email: string;
  orderId: string;
  shippingName: string;
  total: number;
  items: { title: string; quantity: number; unitPrice: number }[];
}) {
  const shortId = orderId.slice(-8).toUpperCase();
  const url = `${APP_URL}/siparis/${orderId}`;
  const itemsHtml = items
    .map(
      (i) =>
        `<li style="margin-bottom:8px;color:#333"><strong>${i.title}</strong> × ${i.quantity} — ${formatPrice(i.unitPrice * i.quantity)}</li>`
    )
    .join("");

  await sendMail({
    to: email,
    subject: `Pazarlia - Siparişin Alındı (#${shortId})`,
    fallbackUrl: url,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:16px">
        <h2 style="color:#111;margin-top:0">Siparişin İçin Teşekkürler! 🎉</h2>
        <p style="color:#444;line-height:1.5">Merhaba <strong>${shippingName}</strong>, <strong>#${shortId}</strong> numaralı siparişinin ödemesi başarıyla alındı ve hazırlanmaya başlandı.</p>
        <div style="background:#f9f9f9;padding:16px;border-radius:12px;margin:16px 0">
          <p style="margin:0 0 8px 0;font-weight:bold;color:#111">Sipariş Özeti:</p>
          <ul style="padding-left:20px;margin:0">${itemsHtml}</ul>
          <p style="margin:12px 0 0 0;font-size:16px;font-weight:bold;color:#111">Toplam: ${formatPrice(total)}</p>
        </div>
        <p style="margin:24px 0">
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#ff5a36;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold">Siparişimi Görüntüle</a>
        </p>
      </div>
    `,
  });
}

export async function sendOrderShippedEmail({
  email,
  orderId,
  shippingName,
  carrier,
  trackingNumber,
  items,
}: {
  email: string;
  orderId: string;
  shippingName: string;
  carrier: string;
  trackingNumber: string;
  items: { title: string; quantity: number }[];
}) {
  const shortId = orderId.slice(-8).toUpperCase();
  const url = `${APP_URL}/siparis/${orderId}`;
  const itemsHtml = items
    .map((i) => `<li style="margin-bottom:6px;color:#333">${i.title} × ${i.quantity}</li>`)
    .join("");

  await sendMail({
    to: email,
    subject: `Pazarlia - Siparişin Kargoya Verildi! 📦 (#${shortId})`,
    fallbackUrl: url,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:16px">
        <h2 style="color:#111;margin-top:0">Siparişin Yola Çıktı! 🚚</h2>
        <p style="color:#444;line-height:1.5">Merhaba <strong>${shippingName}</strong>, <strong>#${shortId}</strong> numaralı siparişindeki ürünler kargoya verildi.</p>
        <div style="background:#f9f9f9;padding:16px;border-radius:12px;margin:16px 0">
          <p style="margin:0 0 6px 0;color:#111"><strong>Kargo Firması:</strong> ${carrier}</p>
          <p style="margin:0 0 12px 0;color:#111"><strong>Takip Numarası:</strong> <span style="font-family:monospace;background:#fff;padding:2px 8px;border-radius:4px;border:1px solid #ddd">${trackingNumber}</span></p>
          <p style="margin:0 0 6px 0;font-weight:bold;color:#111">Kargodaki Ürünler:</p>
          <ul style="padding-left:20px;margin:0">${itemsHtml}</ul>
        </div>
        <p style="margin:24px 0">
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#ff5a36;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold">Kargo Durumunu İncele</a>
        </p>
      </div>
    `,
  });
}

export async function sendOrderDeliveredEmail({
  email,
  orderId,
  shippingName,
  items,
}: {
  email: string;
  orderId: string;
  shippingName: string;
  items: { title: string; quantity: number }[];
}) {
  const shortId = orderId.slice(-8).toUpperCase();
  const url = `${APP_URL}/siparis/${orderId}`;
  const itemsHtml = items
    .map((i) => `<li style="margin-bottom:6px;color:#333">${i.title} × ${i.quantity}</li>`)
    .join("");

  await sendMail({
    to: email,
    subject: `Pazarlia - Siparişin Teslim Edildi! ✅ (#${shortId})`,
    fallbackUrl: url,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:16px">
        <h2 style="color:#111;margin-top:0">Siparişin Teslim Edildi! 🎁</h2>
        <p style="color:#444;line-height:1.5">Merhaba <strong>${shippingName}</strong>, <strong>#${shortId}</strong> numaralı siparişindeki ürünler teslim edildi. İyi günlerde kullanmanı dileriz!</p>
        <div style="background:#f9f9f9;padding:16px;border-radius:12px;margin:16px 0">
          <ul style="padding-left:20px;margin:0">${itemsHtml}</ul>
        </div>
        <p style="margin:24px 0">
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#ff5a36;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold">Sipariş Detayına Git</a>
        </p>
      </div>
    `,
  });
}

export async function sendOrderCancelledEmail({
  email,
  orderId,
  shippingName,
  total,
  wasPaid,
  reason,
}: {
  email: string;
  orderId: string;
  shippingName: string;
  total: number;
  wasPaid: boolean;
  reason?: string;
}) {
  const shortId = orderId.slice(-8).toUpperCase();
  const url = `${APP_URL}/siparis/${orderId}`;

  await sendMail({
    to: email,
    subject: `Pazarlia - Sipariş İptal / İade Bilgilendirmesi (#${shortId})`,
    fallbackUrl: url,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:16px">
        <h2 style="color:#111;margin-top:0">Siparişin İptal Edildi</h2>
        <p style="color:#444;line-height:1.5">Merhaba <strong>${shippingName}</strong>, <strong>#${shortId}</strong> numaralı siparişin iptal edilmiştir.</p>
        ${reason ? `<p style="color:#b91c1c;font-size:14px"><strong>Neden:</strong> ${reason}</p>` : ""}
        ${
          wasPaid
            ? `<div style="background:#f0fdf4;padding:14px;border-radius:12px;margin:16px 0;color:#166534;font-size:14px"><strong>Ödeme İadesi:</strong> ${formatPrice(total)} tutarındaki ödemen iyzico üzerinden kartına otomatik olarak iade edilmiştir.</div>`
            : ""
        }
        <p style="margin:24px 0">
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold">Sipariş Detayını Gör</a>
        </p>
      </div>
    `,
  });
}