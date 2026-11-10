"use client";

import { useActionState } from "react";
import {
  deleteCategory,
  renameCategory,
  type CategoryState,
} from "@/app/actions/admin";

type Props = { id: string; name: string; productCount: number };

export default function CategoryRow({ id, name, productCount }: Props) {
  const [state, formAction, pending] = useActionState<CategoryState, FormData>(
    renameCategory.bind(null, id),
    undefined
  );

  return (
    <li className="panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action={formAction} className="flex flex-1 gap-2">
          <input
            name="name"
            aria-label={`${name} kategorisinin adı`}
            defaultValue={state?.name ?? name}
            maxLength={40}
            required
            className="field"
          />
          <button
            disabled={pending}
            className="rounded-full border border-line bg-white px-4 text-sm font-semibold hover:border-ink disabled:opacity-60"
          >
            Kaydet
          </button>
        </form>

        <p className="text-sm text-muted sm:w-24">{productCount} ürün</p>

        <form action={deleteCategory.bind(null, id)}>
          <button
            disabled={productCount > 0}
            title={productCount > 0 ? "Ürünü olan kategori silinemez" : undefined}
            className="text-sm font-semibold text-muted hover:text-coral disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted"
          >
            Sil
          </button>
        </form>
      </div>

      {state?.error && (
        <p role="alert" className="mt-2 text-sm font-medium text-coral-dark">
          {state.error}
        </p>
      )}
    </li>
  );
}