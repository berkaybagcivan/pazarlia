"use client";

import { useActionState } from "react";
import type { ShipState } from "@/app/actions/fulfillment";
import { CARRIERS } from "@/lib/fulfillment";
import Field from "@/components/Field";

type Props = {
  action: (prev: ShipState, formData: FormData) => Promise<ShipState>;
};

export default function ShipForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="carrier" className="mb-1 block text-sm font-semibold">
          Kargo firması
        </label>
        <select id="carrier" name="carrier" defaultValue="" required className="field">
          <option value="" disabled>
            Seç
          </option>
          {CARRIERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <Field label="Takip numarası" name="trackingNumber" maxLength={40} required />
      {state?.error && (
        <p
          role="alert"
          className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral-dark"
        >
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn">
        {pending ? "Kaydediliyor..." : "Kargoya verildi olarak işaretle"}
      </button>
    </form>
  );
}