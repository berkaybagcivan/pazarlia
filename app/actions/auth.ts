"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export type FormState = { error?: string } | undefined;

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

  await createSession(user.id);
  redirect("/");
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