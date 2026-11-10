import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SellerNav from "@/components/SellerNav";

export default async function SellerLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const seller = await prisma.seller.findUnique({ where: { userId: user.id } });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      {seller && (
        <header className="mb-6">
          <p className="text-sm text-muted">Satıcı paneli</p>
          <h1 className="text-3xl font-extrabold tracking-tight">{seller.storeName}</h1>
          <div className="mt-4">
            <SellerNav />
          </div>
        </header>
      )}

      {seller && !seller.approved && (
        <p role="status" className="mb-6 rounded-2xl bg-sun px-5 py-4 text-sm font-semibold">
          Mağazan şu an yayında değil. Onaylandığında ürünlerin sitede görünür. O zamana kadar ürün ekleyip hazırlık yapabilirsin.
        </p>
      )}

      {children}
    </main>
  );
}