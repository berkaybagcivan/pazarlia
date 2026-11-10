"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

export async function addToCart(productId: string) {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

    const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { seller: true },
  });
  if (
    !product ||
    !product.active ||
    !product.seller.approved ||
    product.stock < 1
  ) {
    redirect("/");
  }

  const where = { userId_productId: { userId, productId } };
  const existing = await prisma.cartItem.findUnique({ where });
  const quantity = Math.min((existing?.quantity ?? 0) + 1, product.stock);

  await prisma.cartItem.upsert({
    where,
    update: { quantity },
    create: { userId, productId, quantity: 1 },
  });

  redirect("/sepet");
}

export async function changeQuantity(itemId: string, delta: number) {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
    include: { product: true },
  });
  if (!item) return;

  const quantity = item.quantity + delta;
  if (quantity < 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(quantity, item.product.stock) },
    });
  }

  revalidatePath("/", "layout");
}

export async function removeItem(itemId: string) {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  await prisma.cartItem.deleteMany({ where: { id: itemId, userId } });
  revalidatePath("/", "layout");
}