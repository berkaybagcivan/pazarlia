"use client";

import { useActionState } from "react";
import { createCategory, type CategoryState } from "@/app/actions/admin";

export default function CategoryForm() {
  const [state, formAction, pending] = useActionState<CategoryState, FormData>(
    createCategory,
    undefined
  );

  return (
    <form action={formAction}>
      <label htmlFor="new-category" className="mb-1 block text-sm font-semibold">
        Yeni kategori
      </label>
      <div className="flex gap-2">
        <input
          id="new-category"
          name="name"
          defaultValue={state?.name}
          maxLength={40}
          required
          placeholder="Örneğin: Kitap"
          className="field"
        />
        <button disabled={pending} className="btn shrink-0">
          {pending ? "Ekleniyor..." : "Ekle"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="mt-2 text-sm font-medium text-coral-dark">
          {state.error}
        </p>
      )}
    </form>
  );
}