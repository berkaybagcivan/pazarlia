import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm text-muted">Pazarlia</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Yönetim paneli</h1>
        <div className="mt-4">
          <AdminNav />
        </div>
      </header>
      {children}
    </main>
  );
}