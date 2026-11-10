import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { addToCart } from "@/app/actions/cart";
import FavoriteButton from "@/components/FavoriteButton";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const userId = await getUserId();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: true, seller: true, category: true },
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
    </main>
  );
}