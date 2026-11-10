import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-20 text-center">
      <p className="text-6xl font-extrabold text-coral">404</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
        Bu sayfayı bulamadık
      </h1>
      <p className="mt-2 text-muted">
        Adres yanlış olabilir ya da ürün kaldırılmış olabilir.
      </p>
      <Link href="/" className="btn mt-6">
        Ürünlere dön
      </Link>
    </main>
  );
}