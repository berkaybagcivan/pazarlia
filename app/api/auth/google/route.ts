import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const base = process.env.APP_URL ?? "http://localhost:3000";
  if (!clientId) redirect("/giris?hata=ayar");

  const state = randomBytes(32).toString("hex");
  const store = await cookies();
  store.set("g_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${base}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}