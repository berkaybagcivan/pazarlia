import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const roleLabels: Record<string, string> = {
  CUSTOMER: "Müşteri",
  SELLER: "Satıcı",
  ADMIN: "Yönetici",
};

const roleStyles: Record<string, string> = {
  CUSTOMER: "bg-paper text-ink",
  SELLER: "bg-lilac text-ink",
  ADMIN: "bg-ink text-white",
};

const dateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const term = q?.trim();

  const users = await prisma.user.findMany({
    where: term
      ? { OR: [{ email: { contains: term } }, { name: { contains: term } }] }
      : {},
    include: { seller: { select: { storeName: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-extrabold tracking-tight">Kullanıcılar</h2>

      <form action="/admin/kullanicilar" role="search" className="mb-4 flex max-w-md gap-2">
        <input
          name="q"
          type="search"
          defaultValue={term}
          aria-label="Kullanıcı ara"
          placeholder="Ad ya da e-posta ara"
          className="field"
        />
        <button className="btn shrink-0">Ara</button>
      </form>

      {users.length === 0 ? (
        <div className="panel py-10 text-center">
          <p className="font-semibold">Kullanıcı bulunamadı.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => (
            <li
              key={u.id}
              className="panel flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{u.name || "İsimsiz"}</p>
                <p className="truncate text-sm text-muted">{u.email}</p>
                <p className="text-xs text-muted">
                  {u.googleId ? "Google ile" : "E-posta ile"} ·{" "}
                  {u.createdAt.toLocaleDateString("tr-TR", dateFormat)}
                  {u.seller && ` · Mağaza: ${u.seller.storeName}`}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${roleStyles[u.role]}`}
              >
                {roleLabels[u.role]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {users.length === 100 && !term && (
        <p className="mt-4 text-sm text-muted">Son 100 kayıt gösteriliyor, daha eskiler için arama yap.</p>
      )}
    </div>
  );
}