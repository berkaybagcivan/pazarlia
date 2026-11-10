import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import GoogleButton from "@/components/GoogleButton";
import { login } from "@/app/actions/auth";

const messages: Record<string, string> = {
  google: "Google ile giriş tamamlanamadı. Tekrar dene.",
  ayar: "Google girişi henüz ayarlanmamış.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { hata } = await searchParams;
  const message = hata ? messages[hata] : undefined;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <div className="panel p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Giriş yap</h1>
        <p className="mb-6 mt-1 text-muted">
          Sepetin ve siparişlerin seni bekliyor.
        </p>

        {message && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-coral/10 px-4 py-3 text-sm font-medium text-coral-dark"
          >
            {message}
          </p>
        )}

        <GoogleButton label="Google ile devam et" />
        <p className="my-5 flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
          veya e-posta ile
        </p>
        <AuthForm mode="login" action={login} />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-semibold text-coral hover:underline">
          Kayıt ol
        </Link>
      </p>
    </main>
  );
}