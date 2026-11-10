import Link from "next/link";
import { formatPrice } from "@/lib/format";
import FavoriteButton from "@/components/FavoriteButton";

type Props = {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    stock: number;
    images: { url: string }[];
    seller: { storeName: string };
  };
  initialFavorited?: boolean;
};

export default function ProductCard({ product: p, initialFavorited = false }: Props) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-ink">
      <div className="absolute right-2.5 top-2.5 z-10">
        <FavoriteButton productId={p.id} initialFavorited={initialFavorited} />
      </div>

      <Link href={`/urun/${p.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.images[0]?.url}
            alt={p.title}
            className="h-full w-full object-cover"
          />
          {p.stock === 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
              Tükendi
            </span>
          )}
          {p.stock > 0 && p.stock <= 5 && (
            <span className="absolute left-3 top-3 rounded-full bg-coral px-2.5 py-1 text-xs font-semibold text-white">
              Son {p.stock} adet
            </span>
          )}
          <span className="absolute bottom-3 left-3 -rotate-3 rounded-md bg-sun py-1 pl-6 pr-3 text-lg font-extrabold text-ink transition-transform before:absolute before:left-2 before:top-1/2 before:h-2 before:w-2 before:-translate-y-1/2 before:rounded-full before:bg-ink/70 before:content-[''] group-hover:rotate-0">
            {formatPrice(p.price)}
          </span>
        </div>
        <div className="p-3">
          <p className="text-xs text-muted">{p.seller.storeName}</p>
          <h2 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-semibold">
            {p.title}
          </h2>
        </div>
      </Link>
    </div>
  );
}