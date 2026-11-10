import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller";
import { formatPrice } from "@/lib/format";
import { markDelivered, markShipped } from "@/app/actions/fulfillment";
import {
  FULFILLMENT_LABELS,
  FULFILLMENT_STYLES,
  groupStatus,
} from "@/lib/fulfillment";
import ShipForm from "@/components/ShipForm";

const dateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export default async function SellerOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { seller } = await requireSeller();
  const { id } = await params;

  const items = await prisma.orderItem.findMany({
    where: {
      orderId: id,
      sellerId: seller.id,
      order: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
    },
    include: { order: true, product: { include: { images: true } } },
  });
  if (items.length === 0) notFound();

  const order = items[0].order;
  const status = groupStatus(items);
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const shipped = items.find((i) => i.carrier);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/satici/siparisler" className="text-sm font-semibold text-muted hover:text-coral">
        Siparişlere dön
      </Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Sipariş {order.id.slice(-8).toUpperCase()}
          </h2>
          <p className="text-sm text-muted">
            {order.createdAt.toLocaleDateString("tr-TR", dateFormat)}
          </p>
        </div>
        <span
          className={`rounded-full px-4 py-1.5 text-sm font-bold ${FULFILLMENT_STYLES[status]}`}
        >
          {FULFILLMENT_LABELS[status]}
        </span>
      </div>

      <section className="panel">
        <h3 className="mb-2 font-extrabold">Teslimat bilgileri</h3>
        <p className="text-sm leading-relaxed">
          {order.shippingName} · {order.shippingPhone}
          <br />
          {order.shippingLine}
          <br />
          {order.shippingDistrict} / {order.shippingCity}
        </p>
      </section>

      <section className="panel mt-4">
        <h3 className="mb-3 font-extrabold">Gönderilecek ürünler</h3>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 text-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={i.product.images[0]?.url}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 font-medium">{i.title}</span>
                <span className="text-muted">{i.quantity} adet</span>
              </span>
              <span className="font-semibold">{formatPrice(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
          <span className="font-semibold">Mağaza toplamı</span>
          <span className="text-xl font-extrabold">{formatPrice(subtotal)}</span>
        </p>
        <p className="mt-2 text-xs text-muted">
          Bu siparişte başka mağazaların ürünleri varsa burada görünmez, onları kendi satıcıları gönderir.
        </p>
      </section>

      <section className="panel mt-4">
        <h3 className="mb-3 font-extrabold">Kargo</h3>

        {status === "PREPARING" && <ShipForm action={markShipped.bind(null, order.id)} />}

        {status !== "PREPARING" && shipped && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">
              <span className="text-muted">Kargo firması:</span> {shipped.carrier}
              <br />
              <span className="text-muted">Takip numarası:</span> {shipped.trackingNumber}
              {shipped.shippedAt && (
                <>
                  <br />
                  <span className="text-muted">Kargoya verilme:</span>{" "}
                  {shipped.shippedAt.toLocaleDateString("tr-TR", dateFormat)}
                </>
              )}
            </p>
            {status === "SHIPPED" ? (
              <form action={markDelivered.bind(null, order.id)}>
                <button className="btn">Teslim edildi olarak işaretle</button>
              </form>
            ) : (
              <p className="rounded-xl bg-mint-soft px-4 py-3 text-sm font-semibold text-mint-ink">
                Bu gönderi teslim edildi.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}