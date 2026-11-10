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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Pazarlia <onboarding@resend.dev>";

  if (!apiKey) {
    console.log("\n==========================================");
    console.log(`📧 [GELİŞTİRME E-POSTASI] Alıcı: ${to}`);
    console.log(`Konu: ${subject}`);
    console.log(`Bağlantı: ${fallbackUrl}`);
    console.log("==========================================\n");
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } catch (e) {
    console.error("E-posta gönderim hatası:", e);
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify?token=${token}`;
  await sendMail({
    to: email,
    subject: "Pazarlia - E-posta Adresini Doğrula",
    fallbackUrl: url,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Pazarlia'ya Hoş Geldin!</h2>
        <p>E-posta adresini doğrulamak için aşağıdaki bağlantıya tıkla:</p>
        <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#ff5a36;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold">E-postamı Doğrula</a></p>
        <p style="font-size:12px;color:#666">Bu bağlantı 24 saat geçerlidir.</p>
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
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Şifre Sıfırlama</h2>
        <p>Hesabının şifresini yenilemek için aşağıdaki bağlantıya tıkla:</p>
        <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#ff5a36;color:#fff;text-decoration:none;border-radius:99px;font-weight:bold">Yeni Şifre Belirle</a></p>
        <p style="font-size:12px;color:#666">Bu bağlantı 1 saat geçerlidir. İsteği sen yapmadıysan bu e-postayı görmezden gelebilirsin.</p>
      </div>
    `,
  });
}