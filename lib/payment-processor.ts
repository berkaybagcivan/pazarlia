import { prisma } from "@/lib/prisma";
import { cancelPayment } from "@/lib/iyzico";
import {
  sendOrderConfirmationEmail,
  sendOrderCancelledEmail,
} from "@/lib/mail";

export type ProcessPaymentResult =
  | { status: "SUCCESS" }
  | { status: "ALREADY_PROCESSED" }
  | { status: "OUT_OF_STOCK_REFUNDED" }
  | { status: "INVALID" };

export async function processSuccessfulPayment(
  orderId: string,
  paymentId: string,
  paidKurus: number
): Promise<ProcessPaymentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: true },
  });

  if (!order || paidKurus !== order.total) {
    return { status: "INVALID" };
  }

  if (order.status === "PAID") {
    return { status: "ALREADY_PROCESSED" };
  }

  if (order.status !== "PENDING") {
    return { status: "INVALID" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "PAID", paymentRef: paymentId },
      });

      if (locked.count === 0) {
        throw new Error("ALREADY_PROCESSED");
      }

      const items = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            active: true,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new Error(`OUT_OF_STOCK:${item.title}`);
        }
      }

      await tx.cartItem.deleteMany({
        where: {
          userId: order.userId,
          productId: { in: items.map((i) => i.productId) },
        },
      });
    });

    // Müşteriye Sipariş Onay E-postası Gönder
    await sendOrderConfirmationEmail({
      email: order.user.email,
      orderId: order.id,
      shippingName: order.shippingName,
      total: order.total,
      items: order.items.map((i) => ({
        title: i.title,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });

    return { status: "SUCCESS" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";

    if (msg === "ALREADY_PROCESSED") {
      return { status: "ALREADY_PROCESSED" };
    }

    if (msg.startsWith("OUT_OF_STOCK")) {
      try {
        if (paymentId) await cancelPayment(paymentId);
      } catch (refundErr) {
        console.error("Otomatik iade hatası:", refundErr);
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", paymentRef: paymentId },
      });

      await sendOrderCancelledEmail({
        email: order.user.email,
        orderId: order.id,
        shippingName: order.shippingName,
        total: order.total,
        wasPaid: true,
        reason: "Ödeme sırasında ürün stoğu tükendiği için otomatik iade yapıldı.",
      });

      return { status: "OUT_OF_STOCK_REFUNDED" };
    }

    throw err;
  }
}