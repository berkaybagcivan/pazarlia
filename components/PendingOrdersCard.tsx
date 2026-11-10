import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function PendingOrdersCard({ sellerId }: { sellerId: string }) {
  const rows = await prisma.orderItem.findMany({
    where: {
      sellerId,
      fulfillment: "PREPARING",
      order: { status: { in: ["PAID", "SHIPPED"] } },
    },
    select: { orderId: true },
  });

  const count = new Set(rows.map((r) => r.orderId)).size;
  if (count === 0) return null;

  return (
    <Link
      href="/satici/siparisler?durum=hazirlaniyor"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sun bg-sun p-5 hover:border-ink"
    >
      <div>
        <p className="text-lg font-extrabold">{count} sipariş kargo bekliyor</p>
        <p className="text-sm">Teslimat adresini görüp kargoya verildi olarak işaretle.</p>
      </div>
      <span className="font-bold">Siparişlere git</span>
    </Link>
  );
}