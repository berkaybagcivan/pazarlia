import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/hesabim?dogrulama=hata", base));
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/hesabim?dogrulama=suresi_doldu", base));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { id: record.id } }),
  ]);

  return NextResponse.redirect(new URL("/hesabim?dogrulama=basarili", base));
}