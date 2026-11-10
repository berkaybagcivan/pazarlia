"use server";

import type { OrderStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller";
import { CARRIERS } from "@/lib/fulfillment";
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from "@/lib/mail";

export type ShipState = { error?: string } | undefined;

async function syncOrderStatus(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { fulfillment: true },
  });
  if (items.length === 0) return;

  let status: OrderStatus = "PAID";
  if (items.every((i) => i.fulfillment === "DELIVERED")) status = "DELIVERED";
  else if (items.every((i) => i.fulfillment !== "PREPARING")) status = "SHIPPED";

  await tx.order.update({ where: { id: orderId }, data: { status } });
}

export async function markShipped(
  orderId: string,
  _prev: ShipState,
  formData: FormData
): Promise<ShipState> {
  const { seller } = await requireSeller();

  const carrier = String(formData.get("carrier") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  if (!(CARRIERS as readonly string[]).includes(carrier)) {
    return { error: "Bir kargo firması seç." };
  }
  if (!/^[A-Za-z0-9 -]{5,40}$/.test(trackingNumber)) {
    return {
      error: "Takip numarası 5 ile 40 karakter olmalı, sadece harf, rakam ve tire içerebilir.",
    };
  }

  const items = await prisma.orderItem.findMany({
    where: {
      orderId,
      sellerId: seller.id,
      fulfillment: "PREPARING",
      order: { status: { in: ["PAID", "SHIPPED"] } },
    },
    select: { id: true, title: true, quantity: true },
  });
  if (items.length === 0) {
    return { error: "Bu sipariş kargoya verilemez. Sayfayı yenileyip durumu kontrol et." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.updateMany({
      where: { id: { in: items.map((i) => i.id) } },
      data: {
        fulfillment: "SHIPPED",
        carrier,
        trackingNumber,
        shippedAt: new Date(),
      },
    });
    await syncOrderStatus(tx, orderId);
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (order) {
    await sendOrderShippedEmail({
      email: order.user.email,
      orderId: order.id,
      shippingName: order.shippingName,
      carrier,
      trackingNumber,
      items: items.map((i) => ({ title: i.title, quantity: i.quantity })),
    });
  }

  revalidatePath(`/satici/siparisler/${orderId}`);
  revalidatePath("/satici/siparisler");
  revalidatePath(`/siparis/${orderId}`);
}

export async function markDelivered(orderId: string) {
  const { seller } = await requireSeller();

  const items = await prisma.orderItem.findMany({
    where: {
      orderId,
      sellerId: seller.id,
      fulfillment: "SHIPPED",
      order: { status: { in: ["PAID", "SHIPPED"] } },
    },
    select: { id: true, title: true, quantity: true },
  });
  if (items.length === 0) return;

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.updateMany({
      where: { id: { in: items.map((i) => i.id) } },
      data: { fulfillment: "DELIVERED", deliveredAt: new Date() },
    });
    await syncOrderStatus(tx, orderId);
  });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (order) {
    await sendOrderDeliveredEmail({
      email: order.user.email,
      orderId: order.id,
      shippingName: order.shippingName,
      items: items.map((i) => ({ title: i.title, quantity: i.quantity })),
    });
  }

  revalidatePath(`/satici/siparisler/${orderId}`);
  revalidatePath("/satici/siparisler");
  revalidatePath(`/siparis/${orderId}`);
}