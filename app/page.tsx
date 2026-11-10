import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import ProductCard from "@/components/ProductCard";

const tileStyles = [
  "bg-coral text-white",
  "bg-sun text-ink",
  "bg-mint text-ink",
  "bg-ink text-white",
  "bg-lilac text-ink",
];

const icons: Record<string, string> = {
  elektronik: "🎧",
  giyim: "👕",
  "ev-yasam": "🏠",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  const { q, kategori } = await searchParams;
  const showHero = !q && !kategori;
  const userId = await getUserId();

  const [products, categories, userFavorites] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        seller: { approved: true },
        ...(q ? { title: { contains: q } } : {}),
        ...(kategori ? { category: { slug: kategori } } : {}),
      },
      include: { images: true, seller: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            products: { where: { active: true, seller: { approved: true } } },
          },
        },
      },
    }),
    userId
      ? prisma.favorite.findMany({
          where: { userId },
          select: { productId: true },
        })
      : Promise.resolve([]),
  ]);

  const favoriteIds = new Set(userFavorites.map((f) => f.productId));
  const activeCategory = categories.find((c) => c.slug === kategori);
  const heading = q
    ? `“${q}” için ${products.length} sonuç`
    : activeCategory
      ? activeCategory.name
      : "Öne Çıkan Ürünler";
  const headingClass = "text-2xl font-extrabold tracking-tight";

  return (
    <main>
      {showHero && (
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Bugün ne arıyorsun?
            </h1>
            <p className="mt-3 max-w-xl text-lg text-muted">
              Bir kategoriye göz at ya da yukarıdaki kutudan ara.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/?kategori=${c.slug}`}
                  className={`flex h-32 flex-col justify-between rounded-2xl p-4 transition-transform hover:-translate-y-0.5 ${tileStyles[i % tileStyles.length]}`}
                >
                  <span aria-hidden className="text-3xl">
                    {icons[c.slug] ?? "🛍️"}
                  </span>
                  <span>
                    <span className="block text-lg font-bold leading-tight">
                      {c.name}
                    </span>
                    <span className="text-sm">{c._count.products} ürün</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          {showHero ? (
            <h2 className={headingClass}>{heading}</h2>
          ) : (
            <h1 className={headingClass}>{heading}</h1>
          )}
          {!showHero && (
            <Link href="/" className="text-sm font-semibold text-coral hover:underline">
              Tüm ürünler
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-8">
            <p className="font-semibold">Aradığın ürünü bulamadık.</p>
            <p className="mt-1 text-sm text-muted">
              Başka bir kelime dene ya da kategorilere göz at.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-coral px-5 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
            >
              Tüm ürünleri göster
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                initialFavorited={favoriteIds.has(p.id)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}