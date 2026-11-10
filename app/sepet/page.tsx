import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { changeQuantity, removeItem } from "@/app/actions/cart";
import CheckoutSteps from "@/components/CheckoutSteps";

export default async function CartPage() {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { images: true, seller: true } } },
    orderBy: { id: "asc" },
  });

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="panel py-12 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Sepetin boş</h1>
          <p className="mt-2 text-muted">
            Beğendiğin ürünleri sepete ekle, burada toplanırlar.
          </p>
          <Link href="/" className="btn mt-6">
            Ürünlere göz at
          </Link>
        </div>
      </main>
    );
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <CheckoutSteps current={1} />
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Sepetim</h1>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="panel flex flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Link href={`/urun/${item.product.slug}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.product.images[0]?.url}
                  alt={item.product.title}
                  className="h-24 w-24 rounded-xl object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/urun/${item.product.slug}`}
                  className="line-clamp-2 font-semibold hover:text-coral"
                >
                  {item.product.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  Satıcı: {item.product.seller.storeName}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatPrice(item.product.price)} / adet
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="flex items-center rounded-full border border-line">
                  <form action={changeQuantity.bind(null, item.id, -1)}>
                    <button
                      aria-label="Adedi azalt"
                      className="h-9 w-9 rounded-full hover:bg-paper"
                    >
                      −
                    </button>
                  </form>
                  <span className="w-8 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <form action={changeQuantity.bind(null, item.id, 1)}>
                    <button
                      aria-label="Adedi artır"
                      disabled={item.quantity >= item.product.stock}
                      className="h-9 w-9 rounded-full hover:bg-paper disabled:opacity-40"
                    >
                      +
                    </button>
                  </form>
                </div>
                <p className="w-28 text-right text-lg font-extrabold">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
                <form action={removeItem.bind(null, item.id)}>
                  <button className="text-sm font-semibold text-muted hover:text-coral">
                    Kaldır
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>

        <aside className="panel lg:sticky lg:top-40">
          <h2 className="font-extrabold">Sipariş özeti</h2>
          <p className="mt-3 flex justify-between text-sm text-muted">
            <span>Ürünler</span>
            <span>{count} adet</span>
          </p>
          <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-semibold">Toplam</span>
            <span className="text-2xl font-extrabold">{formatPrice(total)}</span>
          </p>
          <Link href="/odeme" className="btn mt-5 w-full">
            Ödemeye geç
          </Link>
        </aside>
      </div>
    </main>
  );
}