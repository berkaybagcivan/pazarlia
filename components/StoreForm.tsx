"use client";

import { useActionState } from "react";
import { openStore, type StoreFormState } from "@/app/actions/seller";
import Field from "@/components/Field";

export default function StoreForm() {
  const [state, formAction, pending] = useActionState<StoreFormState, FormData>(
    openStore,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Mağaza adı"
        name="storeName"
        defaultValue={state?.storeName}
        minLength={3}
        maxLength={40}
        required
      />
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-semibold">
          Kısa açıklama <span className="font-normal text-muted">(isteğe bağlı)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={300}
          defaultValue={state?.description}
          className="field"
        />
      </div>
      {state?.error && (
        <p
          role="alert"
          className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral-dark"
        >
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn w-full">
        {pending ? "Bekleyin..." : "Mağazamı aç"}
      </button>
    </form>
  );
}