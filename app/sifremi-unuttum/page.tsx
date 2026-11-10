"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <div className="panel p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Şifremi unuttum</h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          E-posta adresini gir, şifreni yenilemen için sana bir bağlantı gönderelim.
        </p>

        {state?.error && (
          <p className="mb-4 rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral-dark">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="mb-4 rounded-xl bg-mint-soft px-4 py-3 text-sm font-medium text-mint-ink">
            {state.success}
          </p>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">E-posta</label>
            <input
              name="email"
              type="email"
              required
              placeholder="ornek@eposta.com"
              className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="btn w-full disabled:opacity-50"
          >
            {pending ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        Şifreni hatırladın mı?{" "}
        <Link href="/giris" className="font-semibold text-coral hover:underline">
          Giriş yap
        </Link>
      </p>
    </main>
  );
}