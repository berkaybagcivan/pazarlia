"use client";

import { useActionState } from "react";
import { createOrder, type CheckoutState } from "@/app/actions/order";
import Field from "@/components/Field";

export default function CheckoutForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    createOrder,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="Ad soyad"
        name="fullName"
        defaultValue={defaultName}
        autoComplete="name"
        required
      />
      <Field
        label="Telefon"
        name="phone"
        type="tel"
        placeholder="05XX XXX XX XX"
        autoComplete="tel"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="İl" name="city" autoComplete="address-level1" required />
        <Field
          label="İlçe"
          name="district"
          autoComplete="address-level2"
          required
        />
      </div>
      <div>
        <label htmlFor="line" className="mb-1 block text-sm font-semibold">
          Açık adres
        </label>
        <textarea
          id="line"
          name="line"
          rows={3}
          autoComplete="street-address"
          required
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
        {pending ? "Bekleyin..." : "Siparişi oluştur"}
      </button>
    </form>
  );
}