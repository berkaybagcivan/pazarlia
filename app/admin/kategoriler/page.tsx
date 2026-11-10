import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import CategoryForm from "@/components/CategoryForm";
import CategoryRow from "@/components/CategoryRow";

export default async function AdminCategories() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-1 text-xl font-extrabold tracking-tight">Kategoriler</h2>
      <p className="mb-4 text-sm text-muted">
        Satıcılar ürün eklerken bu listeden seçer. Ürünü olan kategori silinemez, önce ürünlerin kategorisini değiştirmek gerekir.
      </p>

      <div className="panel mb-4">
        <CategoryForm />
      </div>

      <ul className="space-y-3">
        {categories.map((c) => (
          <CategoryRow
            key={c.id}
            id={c.id}
            name={c.name}
            productCount={c._count.products}
          />
        ))}
      </ul>
    </div>
  );
}