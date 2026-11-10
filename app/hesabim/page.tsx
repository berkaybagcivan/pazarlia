import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { resendVerificationEmail } from "@/app/actions/auth";
import Avatar from "@/components/Avatar";
import ProductCard from "@/components/ProductCard";

const statusLabels: Record<string, string> = {
  PENDING: "Ödeme bekleniyor",
  PAID: "Ödendi",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-sun text-ink",
  PAID: "bg-mint-soft text-mint-ink",
  SHIPPED: "bg-lilac text-ink",
  DELIVERED: "bg-mint text-ink",
  CANCELLED: "bg-ink text-white",
};

const dateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ dogrulama?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/giris");

  const { dogrulama } = await searchParams;

  const [user, orders, favorites] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.favorite.findMany({
      where: {
        userId,
        product: { active: true, seller: { approved: true } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: { images: true, seller: true },
        },
      },
    }),
  ]);
  if (!user) redirect("/giris");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Hesabım</h1>

      {dogrulama === "basarili" && (
        <p className="mb-5 rounded-2xl bg-mint-soft px-5 py-4 text-sm font-semibold text-mint-ink">
          E-posta adresin başarıyla doğrulandı!
        </p>
      )}
      {dogrulama === "gonderildi" && (
        <p className="mb-5 rounded-2xl bg-sun/40 px-5 py-4 text-sm font-semibold text-ink">
          Doğrulama bağlantısı e-posta adresine gönderildi.
        </p>
      )}
      {(dogrulama === "hata" || dogrulama === "suresi_doldu") && (
        <p className="mb-5 rounded-2xl bg-coral/10 px-5 py-4 text-sm font-semibold text-coral-dark">
          Doğrulama bağlantısı geçersiz veya süresi dolmuş. Aşağıdan yeni bir bağlantı isteyebilirsin.
        </p>
      )}

      <section className="panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar
            name={user.name ?? ""}
            email={user.email}
            image={user.image}
            className="h-16 w-16 text-2xl"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-lg font-bold">
                {user.name || "İsimsiz üye"}
              </p>
              {user.emailVerified ? (
                <span className="rounded-full bg-mint-soft px-2.5 py-0.5 text-xs font-bold text-mint-ink">
                  Doğrulandı
                </span>
              ) : (
                <span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-bold text-ink">
                  Doğrulanmadı
                </span>
              )}
            </div>
            <p className="truncate text-sm text-muted">{user.email}</p>
            <p className="mt-1 text-xs text-muted">
              Üyelik tarihi:{" "}
              {user.createdAt.toLocaleDateString("tr-TR", dateFormat)}
            </p>
          </div>
        </div>

        {!user.emailVerified && (
          <form action={resendVerificationEmail}>
            <button
              type="submit"
              className="rounded-full border border-ink px-4 py-2 text-xs font-bold hover:bg-ink hover:text-white transition"
            >
              E-postamı Doğrula
            </button>
          </form>
        )}
      </section>

      <section id="favoriler" className="mt-8 scroll-mt-40">
        <h2 className="mb-3 text-xl font-extrabold tracking-tight">
          Favorilerim ({favorites.length})
        </h2>

        {favorites.length === 0 ? (
          <div className="panel py-10 text-center">
            <p className="font-semibold">Henüz favori ürünün yok.</p>
            <p className="mt-1 text-sm text-muted">
              Beğendiğin ürünlerin üzerindeki kalp ikonuna tıklayarak buraya ekleyebilirsin.
            </p>
            <Link href="/" className="btn mt-5">
              Ürünlere göz at
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {favorites.map((fav) => (
              <ProductCard
                key={fav.id}
                product={fav.product}
                initialFavorited={true}
              />
            ))}
          </div>
        )}
      </section>

      <section id="siparisler" className="mt-8 scroll-mt-40">
        <h2 className="mb-3 text-xl font-extrabold tracking-tight">
          Siparişlerim
        </h2>

        {orders.length === 0 ? (
          <div className="panel py-10 text-center">
            <p className="font-semibold">Henüz siparişin yok.</p>
            <p className="mt-1 text-sm text-muted">
              Verdiğin siparişler burada listelenir.
            </p>
            <Link href="/" className="btn mt-5">
              Ürünlere göz at
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const count = o.items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <li key={o.id}>
                  <Link
                    href={`/siparis/${o.id}`}
                    className="panel flex flex-wrap items-center justify-between gap-3 hover:border-ink"
                  >
                    <div>
                      <p className="font-bold">
                        No: {o.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted">
                        {o.createdAt.toLocaleDateString("tr-TR", dateFormat)} ·{" "}
                        {count} ürün
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[o.status]}`}
                      >
                        {statusLabels[o.status]}
                      </span>
                      <span className="text-lg font-extrabold">
                        {formatPrice(o.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}