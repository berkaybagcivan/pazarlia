import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller";
import { formatPrice } from "@/lib/format";
import { toggleProduct } from "@/app/actions/seller";

export default async function SellerProducts() {
  const { seller } = await requireSeller();

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    include: { images: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold tracking-tight">
          Ürünlerim <span className="text-muted">({products.length})</span>
        </h2>
        <Link href="/satici/urunler/yeni" className="btn">
          Ürün ekle
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="panel py-10 text-center">
          <p className="font-semibold">Henüz ürünün yok.</p>
          <p className="mt-1 text-sm text-muted">Eklediğin ürünler burada listelenir.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id} className="panel flex flex-col gap-4 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.images[0]?.url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-semibold">{p.title}</p>
                <p className="text-sm text-muted">
                  {p.category.name} · {formatPrice(p.price)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span
                  className={`rounded-full px-3 py-1 ${
                    p.active ? "bg-mint-soft text-mint-ink" : "bg-line text-muted"
                  }`}
                >
                  {p.active ? "Yayında" : "Gizli"}
                </span>
                <span
                  className={`rounded-full px-3 py-1 ${
                    p.stock === 0
                      ? "bg-ink text-white"
                      : p.stock <= 5
                        ? "bg-coral text-white"
                        : "bg-paper text-ink"
                  }`}
                >
                  Stok: {p.stock}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <Link href={`/satici/urunler/${p.id}`} className="hover:text-coral">
                  Düzenle
                </Link>
                <form action={toggleProduct.bind(null, p.id)}>
                  <button className="text-muted hover:text-coral">
                    {p.active ? "Yayından kaldır" : "Yayına al"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}