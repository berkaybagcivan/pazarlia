import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller";
import { saveProduct } from "@/app/actions/seller";
import ProductForm from "@/components/ProductForm";

export default async function NewProduct() {
  await requireSeller();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="panel p-6">
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight">Yeni ürün</h2>
        <ProductForm
          action={saveProduct.bind(null, null)}
          categories={categories}
          submitLabel="Ürünü yayınla"
        />
      </div>
    </div>
  );
}