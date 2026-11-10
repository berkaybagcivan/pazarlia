"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { ProductFormState } from "@/app/actions/seller";
import Field from "@/components/Field";
import ImageUploader from "@/components/ImageUploader";

type Props = {
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  categories: { id: string; name: string }[];
  submitLabel: string;
  product?: {
    title: string;
    description: string;
    price: string;
    stock: number;
    categoryId: string;
    images: string[];
  };
};

export default function ProductForm({ action, categories, submitLabel, product }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [uploading, setUploading] = useState(false);
  const v = state?.values;

  return (
    <form action={formAction} className="space-y-5">
      <Field
        label="Ürün adı"
        name="title"
        defaultValue={v?.title ?? product?.title}
        maxLength={120}
        required
      />

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-semibold">
          Açıklama
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={2000}
          defaultValue={v?.description ?? product?.description}
          required
          className="field"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Fiyat (₺)"
          name="price"
          inputMode="decimal"
          placeholder="129,90"
          defaultValue={v?.price ?? product?.price}
          required
        />
        <Field
          label="Stok"
          name="stock"
          type="number"
          min={0}
          step={1}
          defaultValue={v?.stock ?? product?.stock}
          required
        />
        <div>
          <label htmlFor="categoryId" className="mb-1 block text-sm font-semibold">
            Kategori
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={v?.categoryId ?? product?.categoryId ?? ""}
            required
            className="field"
          >
            <option value="" disabled>
              Seç
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold">Görseller</p>
        <p className="mb-2 text-xs text-muted">
          İlk görsel kapak olur. JPG, PNG veya WebP, en çok 5 görsel. Büyük fotoğraflar otomatik küçültülür.
        </p>
        <ImageUploader initial={product?.images ?? []} onBusyChange={setUploading} />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral-dark"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button disabled={pending || uploading} className="btn">
          {pending ? "Kaydediliyor..." : uploading ? "Görsel yükleniyor..." : submitLabel}
        </button>
        <Link
          href="/satici/urunler"
          className="text-sm font-semibold text-muted hover:text-coral"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  );
}