import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { addToCart } from "@/app/actions/cart";
import FavoriteButton from "@/components/FavoriteButton";
import { addProductReview } from "@/app/actions/review";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ yorum?: string }>;
}) {
  const { slug } = await params;
  const { yorum } = await searchParams;
  const userId = await getUserId();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: true,
      seller: true,
      category: true,
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product || !product.active || !product.seller.approved) notFound();

  const existingFavorite = userId
    ? await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: product.id,
          },
        },
      })
    : null;

  const isFavorited = !!existingFavorite;

  // Ortalama yıldız hesaplama
  const totalReviews = product.reviews.length;
  const avgRating =
    totalReviews > 0
      ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : null;

  // Kullanıcının bu ürünü teslim alıp almadığı (Yorum yazabilmesi için)
  let canReview = false; console.log("DEBUG userId:", userId, "Product ID:", product.id);
  let userExistingReview = null;
  if (userId) {
    const delivered = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        fulfillment: "DELIVERED",
        order: { userId },
      },
    });
    canReview = !!delivered;
    userExistingReview = product.reviews.find((r) => r.userId === userId);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="mb-5 text-sm text-muted">
        <Link href="/" className="hover:text-coral">
          Anasayfa
        </Link>
        {" / "}
        <Link
          href={`/?kategori=${product.category.slug}`}
          className="hover:text-coral"
        >
          {product.category.name}
        </Link>
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-white">
          <div className="absolute right-4 top-4 z-10">
            <FavoriteButton
              productId={product.id}
              initialFavorited={isFavorited}
            />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0]?.url}
            alt={product.title}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div className="flex flex-col items-start">
          <p className="text-sm text-muted">
            Satıcı:{" "}
            <span className="font-semibold text-ink">
              {product.seller.storeName}
            </span>
          </p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight">
            {product.title}
          </h1>

          {/* Yıldız ve Puan Özeti */}
          {totalReviews > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex text-amber-500">
                {"★".repeat(Math.round(Number(avgRating)))}
                {"☆".repeat(5 - Math.round(Number(avgRating)))}
              </div>
              <span className="text-sm font-bold">{avgRating}</span>
              <span className="text-xs text-muted">({totalReviews} değerlendirme)</span>
            </div>
          )}

          <p className="relative mt-6 -rotate-2 rounded-lg bg-sun py-2 pl-9 pr-5 text-4xl font-extrabold before:absolute before:left-3 before:top-1/2 before:h-3 before:w-3 before:-translate-y-1/2 before:rounded-full before:bg-ink/70 before:content-['']">
            {formatPrice(product.price)}
          </p>

          <p className="mt-6 max-w-prose leading-relaxed">
            {product.description}
          </p>

          <p className="mt-5">
            {product.stock === 0 ? (
              <span className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">
                Tükendi
              </span>
            ) : product.stock <= 5 ? (
              <span className="rounded-full bg-coral px-3 py-1 text-sm font-semibold text-white">
                Son {product.stock} adet
              </span>
            ) : (
              <span className="rounded-full bg-mint-soft px-3 py-1 text-sm font-semibold text-mint-ink">
                Stokta var
              </span>
            )}
          </p>

          <div className="mt-6 flex w-full items-center gap-3 md:w-auto">
            <form
              action={addToCart.bind(null, product.id)}
              className="flex-1 md:flex-initial"
            >
              <button
                disabled={product.stock < 1}
                className="w-full rounded-full bg-coral px-10 py-4 text-lg font-bold text-white hover:bg-coral-dark disabled:bg-muted md:w-auto"
              >
                Sepete ekle
              </button>
            </form>

            <FavoriteButton
              productId={product.id}
              initialFavorited={isFavorited}
            />
          </div>
        </div>
      </div>

      {/* Ürün Değerlendirmeleri ve Yorumlar Bölümü */}
      <section className="mt-16 border-t border-line pt-10">
        <h2 className="text-2xl font-extrabold">Ürün Değerlendirmeleri</h2>

        {yorum === "basarili" && (
          <p className="mt-4 rounded-2xl bg-mint-soft px-5 py-3 font-semibold text-mint-ink">
            Değerlendirmen başarıyla kaydedildi!
          </p>
        )}

        {/* Yorum Yapma Formu (Sadece ürünü teslim almış kullanıcılar için) */}
        {canReview && (
          <div className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-3">
              {userExistingReview ? "Değerlendirmeni Güncelle" : "Bu Ürünü Değerlendir"}
            </h3>
            <form action={addProductReview.bind(null, product.id)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Yıldız Puanı</label>
                <select
                  name="rating"
                  defaultValue={userExistingReview?.rating ?? 5}
                  className="w-full sm:w-48 rounded-xl border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                >
                  <option value="5">★★★★★ (5 - Mükemmel)</option>
                  <option value="4">★★★★☆ (4 - Çok İyi)</option>
                  <option value="3">★★★☆☆ (3 - Ortalama)</option>
                  <option value="2">★★☆☆☆ (2 - Beğenmedim)</option>
                  <option value="1">★☆☆☆☆ (1 - Çok Kötü)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Yorumun (İsteğe bağlı)</label>
                <textarea
                  name="comment"
                  rows={3}
                  maxLength={500}
                  defaultValue={userExistingReview?.comment ?? ""}
                  placeholder="Ürün hakkındaki düşüncelerini yazabilirsin..."
                  className="w-full rounded-xl border border-line p-3 text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                ></textarea>
              </div>

              <button
                type="submit"
                className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white hover:bg-coral transition"
              >
                {userExistingReview ? "Değerlendirmeyi Güncelle" : "Değerlendirmeyi Gönder"}
              </button>
            </form>
          </div>
        )}

        {/* Yapılan Yorumların Listesi */}
        <div className="mt-8 space-y-4">
          {product.reviews.length === 0 ? (
            <p className="text-sm text-muted">Bu ürün için henüz değerlendirme yapılmamış.</p>
          ) : (
            product.reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{r.user.name}</span>
                  <div className="flex text-amber-500 text-sm">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </div>
                </div>
                {r.comment && <p className="mt-2 text-sm text-muted">{r.comment}</p>}
                <p className="mt-3 text-xs text-muted">
                  {new Date(r.createdAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}