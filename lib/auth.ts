import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

export async function getCurrentUser() {
  const id = await getUserId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      seller: { select: { id: true } },
    },
  });
}