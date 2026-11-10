import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { setSellerApproved } from "@/app/actions/admin";

const dateFormat: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export default async function AdminSellers() {
  await requireAdmin();

  const sellers = await prisma.seller.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { products: true } },
    },
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h2 className="mb-1 text-xl font-extrabold tracking-tight">
        Mağazalar <span className="text-muted">({sellers.length})</span>
      </h2>
      <p className="mb-4 text-sm text-muted">
        Onayı kaldırılan mağazanın ürünleri sitede görünmez ve satın alınamaz. Onay bekleyenler en üstte.
      </p>

      {sellers.length === 0 ? (
        <div className="panel py-10 text-center">
          <p className="font-semibold">Henüz mağaza yok.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sellers.map((s) => (
            <li
              key={s.id}
              className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-bold">{s.storeName}</p>
                <p className="truncate text-sm text-muted">
                  {s.user.name ?? "İsimsiz"} · {s.user.email}
                </p>
                <p className="text-xs text-muted">
                  {s._count.products} ürün · Açılış:{" "}
                  {s.createdAt.toLocaleDateString("tr-TR", dateFormat)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    s.approved ? "bg-mint-soft text-mint-ink" : "bg-sun text-ink"
                  }`}
                >
                  {s.approved ? "Onaylı" : "Onay bekliyor"}
                </span>
                <form action={setSellerApproved.bind(null, s.id, !s.approved)}>
                  <button
                    className={
                      s.approved
                        ? "text-sm font-semibold text-muted hover:text-coral"
                        : "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-coral"
                    }
                  >
                    {s.approved ? "Onayı kaldır" : "Onayla"}
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