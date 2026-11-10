import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSteps from "@/components/CheckoutSteps";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { images: true } } },
    orderBy: { id: "asc" },
  });
  if (items.length === 0) redirect("/sepet");

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <CheckoutSteps current={2} />
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">
        Teslimat bilgileri
      </h1>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <section className="panel p-6">
          <CheckoutForm defaultName={user.name ?? ""} />
        </section>

        <aside className="panel lg:sticky lg:top-40">
          <h2 className="font-extrabold">Sipariş özeti</h2>
          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={i.product.images[0]?.url}
                  alt={i.product.title}
                  className="h-12 w-12 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-medium">
                    {i.product.title}
                  </span>
                  <span className="text-muted">{i.quantity} adet</span>
                </span>
                <span className="font-semibold">
                  {formatPrice(i.product.price * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
            <span className="font-semibold">Toplam</span>
            <span className="text-2xl font-extrabold">{formatPrice(total)}</span>
          </p>
        </aside>
      </div>
    </main>
  );
}