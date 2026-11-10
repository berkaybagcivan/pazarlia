import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/seller";
import { saveProduct } from "@/app/actions/seller";
import ProductForm from "@/components/ProductForm";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { seller } = await requireSeller();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, sellerId: seller.id },
      include: { images: { orderBy: { id: "asc" } } },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="panel p-6">
        <h2 className="mb-5 text-2xl font-extrabold tracking-tight">Ürünü düzenle</h2>
        <ProductForm
          action={saveProduct.bind(null, product.id)}
          categories={categories}
          submitLabel="Değişiklikleri kaydet"
          product={{
            title: product.title,
            description: product.description,
            price: (product.price / 100).toFixed(2).replace(".", ","),
            stock: product.stock,
            categoryId: product.categoryId,
            images: product.images.map((i) => i.url),
          }}
        />
      </div>
    </div>
  );
}