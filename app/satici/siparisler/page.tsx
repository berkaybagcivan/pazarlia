import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller";
import { formatPrice } from "@/lib/format";
import {
  FULFILLMENT_LABELS,
  FULFILLMENT_STYLES,
  groupStatus,
  type FulfillmentKey,
} from "@/lib/fulfillment";

const tabs = [
  { key: "tumu", label: "Tümü", status: null },
  { key: "hazirlaniyor", label: "Hazırlanıyor", status: "PREPARING" },
  { key: "kargoda", label: "Kargoya verildi", status: "SHIPPED" },
  { key: "teslim", label: "Teslim edildi", status: "DELIVERED" },
] as const;

const dateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export default async function SellerOrders({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  const { seller } = await requireSeller();
  const { durum } = await searchParams;

  const rows = await prisma.orderItem.findMany({
    where: {
      sellerId: seller.id,
      order: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
    },
    include: { order: true },
    orderBy: { order: { createdAt: "desc" } },
  });

  // Aynı siparişin bu satıcıya ait kalemlerini tek satırda toplar
  const map = new Map<string, typeof rows>();
  for (const r of rows) map.set(r.orderId, [...(map.get(r.orderId) ?? []), r]);

  const groups = Array.from(map.values()).map((items) => ({
    order: items[0].order,
    items,
    status: groupStatus(items) as FulfillmentKey,
    subtotal: items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  }));

  const active = tabs.find((t) => t.key === durum) ?? tabs[0];
  const shown = active.status ? groups.filter((g) => g.status === active.status) : groups;
  const countOf = (status: string | null) =>
    status ? groups.filter((g) => g.status === status).length : groups.length;

  return (
    <div>
      <h2 className="mb-4 text-xl font-extrabold tracking-tight">Siparişler</h2>

      <nav aria-label="Sipariş durumu" className="mb-5 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "tumu" ? "/satici/siparisler" : `/satici/siparisler?durum=${t.key}`}
            aria-current={t.key === active.key ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${
              t.key === active.key
                ? "border-ink bg-ink text-white"
                : "border-line bg-white hover:border-ink"
            }`}
          >
            {t.label} ({countOf(t.status)})
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="panel py-10 text-center">
          <p className="font-semibold">
            {groups.length === 0 ? "Henüz siparişin yok." : "Bu durumda sipariş yok."}
          </p>
          <p className="mt-1 text-sm text-muted">
            Ödemesi tamamlanan siparişler burada görünür.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((g) => {
            const first = g.items[0].title;
            const rest = g.items.length - 1;
            return (
              <li key={g.order.id}>
                <Link
                  href={`/satici/siparisler/${g.order.id}`}
                  className="panel flex flex-col gap-3 hover:border-ink sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-bold">No: {g.order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-muted">
                      {g.order.createdAt.toLocaleDateString("tr-TR", dateFormat)} ·{" "}
                      {g.order.shippingName}, {g.order.shippingCity}
                    </p>
                    <p className="mt-1 truncate text-sm">
                      {first}
                      {rest > 0 && <span className="text-muted"> ve {rest} ürün daha</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${FULFILLMENT_STYLES[g.status]}`}
                    >
                      {FULFILLMENT_LABELS[g.status]}
                    </span>
                    <span className="text-lg font-extrabold">{formatPrice(g.subtotal)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}