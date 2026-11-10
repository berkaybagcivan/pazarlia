"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions/auth";
import Field from "@/components/Field";

type Props = {
  mode: "register" | "login";
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
};

export default function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="space-y-4">
      {isRegister && (
        <Field label="Ad soyad" name="name" autoComplete="name" required />
      )}
      <Field
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Field
        label="Şifre"
        name="password"
        type="password"
        autoComplete={isRegister ? "new-password" : "current-password"}
        minLength={isRegister ? 8 : undefined}
        required
      />
      {isRegister && (
        <p className="-mt-2 text-xs text-muted">En az 8 karakter olmalı.</p>
      )}
      {state?.error && (
        <p
          role="alert"
          className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral-dark"
        >
          {state.error}
        </p>
      )}
      <button disabled={pending} className="btn w-full">
        {pending ? "Bekleyin..." : isRegister ? "Kayıt ol" : "Giriş yap"}
      </button>
    </form>
  );
}