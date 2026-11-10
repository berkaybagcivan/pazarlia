import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

async function fetchGoogleProfile(code: string): Promise<GoogleProfile | null> {
  const base = process.env.APP_URL ?? "http://localhost:3000";

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${base}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    console.error("Google token hatası:", tokenRes.status, await tokenRes.text());
    return null;
  }

  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return null;

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!infoRes.ok) return null;

  return (await infoRes.json()) as GoogleProfile;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expected = store.get("g_state")?.value;
  store.delete("g_state");

  // Kullanıcı vazgeçtiyse ya da state tutmuyorsa (sahte istek) giriş yapılmaz
  if (!code || !state || !expected || state !== expected) {
    redirect("/giris?hata=google");
  }

  let profile: GoogleProfile | null = null;
  try {
    profile = await fetchGoogleProfile(code);
  } catch (e) {
    console.error("Google profil hatası:", e);
  }

  if (!profile?.sub || !profile.email || !profile.email_verified) {
    redirect("/giris?hata=google");
  }

  const googleId = profile.sub;
  const email = profile.email.toLowerCase();
  const name = profile.name?.trim() || null;
  const image = profile.picture || null;

  let user = await prisma.user.findUnique({ where: { googleId } });

  if (user) {
    // Fotoğraf her girişte güncellenir; Google'da kaldırıldıysa baş harfe döner
    user = await prisma.user.update({
      where: { id: user.id },
      data: { image, ...(user.name ? {} : { name }) },
    });
  } else {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Aynı e-postayla açılmış hesap varsa Google'a bağlanır, eski şifre kapatılır
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          googleId,
          image,
          passwordHash: null,
          ...(existing.name ? {} : { name }),
        },
      });
    } else {
      user = await prisma.user.create({
        data: { email, name, googleId, image },
      });
    }
  }

  await createSession(user.id);
  redirect("/");
}