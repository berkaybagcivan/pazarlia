import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { startPayment } from "@/app/actions/payment";
import CheckoutSteps from "@/components/CheckoutSteps";
import {
  FULFILLMENT_LABELS,
  FULFILLMENT_STYLES,
  groupStatus,
} from "@/lib/fulfillment";

const statusLabels: Record<string, string> = {
  PENDING: "Ödeme bekleniyor",
  PAID: "Ödendi",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-sun text-ink",
  PAID: "bg-mint-soft text-mint-ink",
  SHIPPED: "bg-lilac text-ink",
  DELIVERED: "bg-mint text-ink",
  CANCELLED: "bg-ink text-white",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ odeme?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const { id } = await params;
  const { odeme } = await searchParams;

  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { items: { include: { seller: { select: { storeName: true } } } } },
  });
  if (!order) notFound();

  // Ürünleri mağazaya göre gruplar
  const groups = new Map<string, { storeName: string; items: typeof order.items }>();
  for (const i of order.items) {
    const g = groups.get(i.sellerId) ?? { storeName: i.seller.storeName, items: [] };
    g.items.push(i);
    groups.set(i.sellerId, g);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      {order.status === "PENDING" && <CheckoutSteps current={3} />}

      {odeme === "basarili" && order.status !== "PENDING" && (
        <p className="mb-5 rounded-2xl bg-mint-soft px-5 py-4 font-semibold text-mint-ink">
          Ödemen alındı, teşekkürler! Siparişin hazırlanıyor.
        </p>
      )}
      {odeme === "hata" && order.status === "PENDING" && (
        <p
          role="alert"
          className="mb-5 rounded-2xl bg-coral/10 px-5 py-4 font-semibold text-coral-dark"
        >
          Ödeme tamamlanamadı. Aşağıdan tekrar deneyebilirsin.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Sipariş</h1>
          <p className="mt-1 text-sm text-muted">
            No: {order.id.slice(-8).toUpperCase()}
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${statusStyles[order.status]}`}
        >
          {statusLabels[order.status]}
        </span>
      </div>

      <section className="panel mt-6">
        <h2 className="mb-2 font-extrabold">Teslimat adresi</h2>
        <p className="text-sm leading-relaxed">
          {order.shippingName} · {order.shippingPhone}
          <br />
          {order.shippingLine}
          <br />
          {order.shippingDistrict} / {order.shippingCity}
        </p>
      </section>

      {order.status === "PENDING" ? (
        <section className="panel mt-4">
          <h2 className="mb-3 font-extrabold">Ürünler</h2>
          <ul className="space-y-2 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4">
                <span>
                  {i.title} × {i.quantity}
                </span>
                <span className="font-semibold">
                  {formatPrice(i.unitPrice * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        Array.from(groups.entries()).map(([sellerId, g]) => {
          const status = groupStatus(g.items);
          const shipped = g.items.find((i) => i.carrier);
          return (
            <section key={sellerId} className="panel mt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-extrabold">{g.storeName}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${FULFILLMENT_STYLES[status]}`}
                >
                  {FULFILLMENT_LABELS[status]}
                </span>
              </div>
              <ul className="space-y-2 text-sm">
                {g.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-4">
                    <span>
                      {i.title} × {i.quantity}
                    </span>
                    <span className="font-semibold">
                      {formatPrice(i.unitPrice * i.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              {shipped && (
                <p className="mt-3 border-t border-line pt-3 text-sm">
                  <span className="text-muted">Kargo:</span> {shipped.carrier}
                  <br />
                  <span className="text-muted">Takip numarası:</span>{" "}
                  {shipped.trackingNumber}
                </p>
              )}
            </section>
          );
        })
      )}

      <section className="panel mt-4">
        <p className="flex items-baseline justify-between">
          <span className="font-semibold">Toplam</span>
          <span className="text-2xl font-extrabold">{formatPrice(order.total)}</span>
        </p>
      </section>

      {order.status === "PENDING" && (
        <section className="panel mt-4">
          <p className="text-sm text-muted">
            Ödeme iyzico’nun güvenli sayfasında yapılır. Kart bilgilerin bizim
            sunucumuza ulaşmaz.
          </p>
          <form action={startPayment.bind(null, order.id)}>
            <button className="btn mt-4 w-full sm:w-auto">
              Güvenli ödeme ile öde
            </button>
          </form>
        </section>
      )}
    </main>
  );
}