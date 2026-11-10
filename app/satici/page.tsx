import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import StoreForm from "@/components/StoreForm";
 import PendingOrdersCard from "@/components/PendingOrdersCard";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

export default async function SellerHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const seller = await prisma.seller.findUnique({ where: { userId: user.id } });

  if (!seller) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="panel p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Mağazanı aç</h1>
          <p className="mb-6 mt-1 text-muted">
            Ürünlerini ekle, satışlarını buradan takip et.
          </p>
          <StoreForm />
        </div>
      </div>
    );
  }

  const [products, sold] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: seller.id },
      select: { id: true, title: true, stock: true, active: true },
    }),
    prisma.orderItem.findMany({
      where: {
        sellerId: seller.id,
        order: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
      },
      select: { quantity: true, unitPrice: true, orderId: true },
    }),
  ]);

  const revenue = sold.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const units = sold.reduce((sum, i) => sum + i.quantity, 0);
  const orderCount = new Set(sold.map((i) => i.orderId)).size;
  const activeCount = products.filter((p) => p.active).length;
  const lowStock = products.filter((p) => p.active && p.stock <= 5);

  if (products.length === 0) {
    return (
      <div className="panel py-12 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight">İlk ürününü ekle</h2>
        <p className="mt-2 text-muted">
          Mağazan hazır. Ürünün eklendiğinde ana sayfada görünür.
        </p>
        <Link href="/satici/urunler/yeni" className="btn mt-6">
          Ürün ekle
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <p className="text-sm text-white/70">Toplam satış</p>
          <p className="mt-1 text-3xl font-extrabold">{formatPrice(revenue)}</p>
        </div>
        <Stat label="Sipariş" value={orderCount} />
        <Stat label="Satılan adet" value={units} />
        <Stat label="Yayındaki ürün" value={activeCount} />
      </div>
               <PendingOrdersCard sellerId={seller.id} />
      {lowStock.length > 0 && (
        <section className="panel">
          <h2 className="font-extrabold">Stoğu azalan ürünler</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4">
                <Link href={`/satici/urunler/${p.id}`} className="hover:text-coral">
                  {p.title}
                </Link>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    p.stock === 0 ? "bg-ink text-white" : "bg-coral text-white"
                  }`}
                >
                  {p.stock === 0 ? "Tükendi" : `${p.stock} adet kaldı`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}