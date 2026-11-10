import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";
import { setSellerApproved } from "@/app/actions/admin";

const paidStatuses: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="panel">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

export default async function AdminHome() {
  await requireAdmin();

  const [userCount, sellerCount, pendingCount, pending, productCount, orders] =
    await Promise.all([
      prisma.user.count(),
      prisma.seller.count(),
      prisma.seller.count({ where: { approved: false } }),
      prisma.seller.findMany({
        where: { approved: false },
        include: {
          user: { select: { email: true } },
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 5,
      }),
      prisma.product.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: { status: { in: paidStatuses } },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <p className="text-sm text-white/70">Toplam ciro</p>
          <p className="mt-1 text-3xl font-extrabold">
            {formatPrice(orders._sum.total ?? 0)}
          </p>
        </div>
        <Stat label="Ödenen sipariş" value={orders._count} />
        <Stat label="Üye" value={userCount} />
        <Stat label="Mağaza" value={sellerCount} />
      </div>

      <section className="panel">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-extrabold">
            Onay bekleyen mağazalar{" "}
            <span className="text-muted">({pendingCount})</span>
          </h2>
          <Link href="/admin/saticilar" className="text-sm font-semibold text-coral hover:underline">
            Tüm mağazalar
          </Link>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-muted">Onay bekleyen mağaza yok.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{s.storeName}</p>
                  <p className="truncate text-sm text-muted">
                    {s.user.email} · {s._count.products} ürün
                  </p>
                </div>
                <form action={setSellerApproved.bind(null, s.id, true)}>
                  <button className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-coral">
                    Onayla
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted">Sitede toplam {productCount} ürün kayıtlı.</p>
    </div>
  );
}