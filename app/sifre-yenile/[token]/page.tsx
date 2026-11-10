"use client";

import { use, useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/app/actions/auth";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const boundAction = resetPassword.bind(null, token);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <div className="panel p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Yeni şifre belirle</h1>
        <p className="mb-6 mt-1 text-sm text-muted">
          Hesabın için en az 8 karakterli yeni bir şifre gir.
        </p>

        {state?.error && (
          <p className="mb-4 rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral-dark">
            {state.error}
          </p>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Yeni şifre</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Yeni şifre (Tekrar)</label>
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="btn w-full disabled:opacity-50"
          >
            {pending ? "Güncelleniyor..." : "Şifreyi güncelle"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/giris" className="font-semibold text-coral hover:underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </main>
  );
}