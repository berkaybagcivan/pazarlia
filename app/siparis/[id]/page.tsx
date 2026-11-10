import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { startPayment, cancelAndRefundOrder } from "@/app/actions/payment";
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
  searchParams: Promise<{ odeme?: string; iptal?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const { id } = await params;
  const { odeme, iptal } = await searchParams;

  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { items: { include: { seller: { select: { storeName: true } } } } },
  });
  if (!order) notFound();

  const groups = new Map<string, { storeName: string; items: typeof order.items }>();
  for (const i of order.items) {
    const g = groups.get(i.sellerId) ?? { storeName: i.seller.storeName, items: [] };
    g.items.push(i);
    groups.set(i.sellerId, g);
  }

  const anyShipped = order.items.some((i) => i.fulfillment !== "PREPARING");
  const canCancel =
    (order.status === "PENDING" || order.status === "PAID") && !anyShipped;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      {order.status === "PENDING" && <CheckoutSteps current={3} />}

      {odeme === "basarili" && order.status === "PAID" && (
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
      {odeme === "stok_yetersiz" && (
        <p
          role="alert"
          className="mb-5 rounded-2xl bg-coral/10 px-5 py-4 font-semibold text-coral-dark"
        >
          Siparişteki ürünlerden birinin stoğu tükendiği için ödeme başlatılamadı.
        </p>
      )}
      {odeme === "stok_bitti_iade" && (
        <p
          role="alert"
          className="mb-5 rounded-2xl bg-coral/10 px-5 py-4 font-semibold text-coral-dark"
        >
          Ödeme sırasında ürün stoğu tükendiği için siparişin iptal edildi ve ödemen iyzico üzerinden otomatik olarak kartına iade edildi.
        </p>
      )}
      {iptal === "basarili" && order.status === "CANCELLED" && (
        <p className="mb-5 rounded-2xl bg-mint-soft px-5 py-4 font-semibold text-mint-ink">
          Siparişin iptal edildi{order.paymentRef ? " ve ödemen kartına iade edildi" : ""}.
        </p>
      )}
      {iptal === "iyzico_hata" && (
        <p
          role="alert"
          className="mb-5 rounded-2xl bg-coral/10 px-5 py-4 font-semibold text-coral-dark"
        >
          İade işlemi sırasında ödeme sağlayıcısında bir hata oluştu. Lütfen tekrar dene.
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

      {canCancel && (
        <section className="panel mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-sm">Siparişi iptal etmek mi istiyorsun?</p>
            <p className="text-xs text-muted">
              {order.status === "PAID"
                ? "Ürünler henüz kargoya verilmediği için iptal ettiğinde ödemen anında kartına iade edilir."
                : "Ödeme bekleyen bu siparişi iptal edebilirsin."}
            </p>
          </div>
          <form action={cancelAndRefundOrder.bind(null, order.id)}>
            <button
              type="submit"
              className="rounded-full border border-coral px-5 py-2 text-sm font-semibold text-coral transition hover:bg-coral hover:text-white"
            >
              {order.status === "PAID" ? "İptal Et ve İade Al" : "Siparişi İptal Et"}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}