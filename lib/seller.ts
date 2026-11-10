import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Giriş yapmış ve mağazası olan kullanıcıyı döndürür, değilse yönlendirir
export async function requireSeller() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const seller = await prisma.seller.findUnique({ where: { userId: user.id } });
  if (!seller) redirect("/satici");

  return { user, seller };
}