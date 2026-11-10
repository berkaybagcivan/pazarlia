import nodemailer from "nodemailer";

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
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 1. Gmail SMTP ayarlıysa gerçek e-posta gönder (Tüm alıcılara gider)
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
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
      return;
    } catch (e) {
      console.error("SMTP e-posta gönderim hatası:", e);
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
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:16px">
        <h2 style="color:#111">Pazarlia'ya Hoş Geldin!</h2>
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
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:16px">
        <h2 style="color:#111">Şifre Sıfırlama</h2>
        <p style="color:#444;line-height:1.5">Hesabının şifresini yenilemek için aşağıdaki butona tıkla:</p>
        <p style="margin:24px 0">
          <a href="${url}" style="display:inline-block;padding:12px 24px;background:#ff5a36;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold">Yeni Şifre Belirle</a>
        </p>
        <p style="font-size:12px;color:#888">Bu bağlantı 1 saat geçerlidir. İsteği sen yapmadıysan bu e-postayı görmezden gelebilirsin.</p>
      </div>
    `,
  });
}