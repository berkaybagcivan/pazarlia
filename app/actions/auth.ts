"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getUserId } from "@/lib/session";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mail";

export type FormState = { error?: string; success?: string } | undefined;

async function createAndSendVerification(userId: string, email: string) {
  await prisma.verificationToken.deleteMany({ where: { userId } });
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 saat
  await prisma.verificationToken.create({
    data: { token, userId, expiresAt },
  });
  await sendVerificationEmail(email, token);
}

export async function register(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email.includes("@")) {
    return { error: "Ad ve geçerli bir e-posta girin." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalı." };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { error: "Bu e-posta ile zaten bir hesap var." };
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });

  await createAndSendVerification(user.id, user.email);
  await createSession(user.id);
  redirect("/hesabim?dogrulama=gonderildi");
}

export async function login(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && !user.passwordHash) {
    return {
      error: "Bu hesap Google ile bağlı. “Google ile devam et” düğmesini kullan.",
    };
  }
  if (
    !user ||
    !user.passwordHash ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    return { error: "E-posta veya şifre hatalı." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

export async function resendVerificationEmail() {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.emailVerified) redirect("/hesabim");

  await createAndSendVerification(user.id, user.email);
  revalidatePath("/hesabim");
  redirect("/hesabim?dogrulama=gonderildi");
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Kullanıcı bulunamasa bile güvenlik için aynı başarı mesajını döneriz
  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 saat
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });
    await sendPasswordResetEmail(user.email, token);
  }

  return {
    success:
      "Eğer bu e-posta ile kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.",
  };
}

export async function resetPassword(
  token: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Yeni şifre en az 8 karakter olmalı." };
  }
  if (password !== confirm) {
    return { error: "Şifreler birbiriyle eşleşmiyor." };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    return { error: "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        emailVerified: new Date(),
      },
    }),
    prisma.passwordResetToken.delete({ where: { id: record.id } }),
  ]);

  redirect("/giris?sifre=yenilendi");
}