import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ProfileMenu from "@/components/ProfileMenu";

export default async function Header() {
  const [categories, user] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getCurrentUser(),
  ]);

  const cartCount = user
    ? ((
        await prisma.cartItem.aggregate({
          where: { userId: user.id },
          _sum: { quantity: true },
        })
      )._sum.quantity ?? 0)
    : 0;

  const ghost =
    "rounded-full px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white";

  return (
    <header className="sticky top-0 z-30 bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="order-1 text-2xl font-extrabold tracking-tight">
          pazarlia<span className="text-sun">.</span>
        </Link>

        <form
          action="/"
          role="search"
          className="order-3 flex w-full overflow-hidden rounded-full bg-white focus-within:ring-2 focus-within:ring-sun md:order-2 md:w-auto md:flex-1"
        >
          <input
            name="q"
            type="search"
            aria-label="Ürün ara"
            placeholder="Ürün ara"
            className="min-w-0 flex-1 bg-transparent px-5 py-2.5 text-sm text-ink outline-none placeholder:text-muted"
          />
          <button className="bg-coral px-6 text-sm font-semibold text-white hover:bg-coral-dark">
            Ara
          </button>
        </form>

        <div className="order-2 ml-auto flex items-center gap-2 text-sm md:order-3 md:ml-0">
          {!user && (
            <>
              <Link href="/giris" className={ghost}>
                Giriş
              </Link>
              <Link
                href="/kayit"
                className="rounded-full bg-sun px-4 py-2 font-semibold text-ink hover:bg-white"
              >
                Kayıt ol
              </Link>
            </>
          )}

          <Link
            href="/sepet"
            className="flex items-center gap-2 rounded-full bg-coral px-4 py-2 font-semibold text-white hover:bg-coral-dark"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="18" cy="20" r="1.5" />
              <path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20.5 8H6" />
            </svg>
            Sepet
            {cartCount > 0 && (
              <span className="rounded-full bg-sun px-1.5 text-xs font-bold text-ink">
                {cartCount}
              </span>
            )}
          </Link>

                      {user && (
            <ProfileMenu
              name={user.name ?? ""}
              email={user.email}
              image={user.image}
              isSeller={!!user.seller}
              isAdmin={user.role === "ADMIN"}
            />
          )}
        </div>
      </div>

      <nav aria-label="Kategoriler" className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto pl-1 pr-4 py-2 text-sm">
          <Link href="/" className={`whitespace-nowrap py-1 ${ghost}`}>
            Tümü
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?kategori=${c.slug}`}
              className={`whitespace-nowrap py-1 ${ghost}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}