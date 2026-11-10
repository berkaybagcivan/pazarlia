import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import GoogleButton from "@/components/GoogleButton";
import { register } from "@/app/actions/auth";

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <div className="panel p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Hesap oluştur</h1>
        <p className="mb-6 mt-1 text-muted">
          Sepetini kaydet, siparişlerini takip et.
        </p>

        <GoogleButton label="Google ile kayıt ol" />
        <p className="my-5 flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
          veya e-posta ile
        </p>
        <AuthForm mode="register" action={register} />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-semibold text-coral hover:underline">
          Giriş yap
        </Link>
      </p>
    </main>
  );
}