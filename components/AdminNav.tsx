"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Genel bakış", exact: true },
  { href: "/admin/saticilar", label: "Satıcılar", exact: false },
  { href: "/admin/kategoriler", label: "Kategoriler", exact: false },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Yönetim paneli" className="flex gap-2 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${
              active
                ? "border-ink bg-ink text-white"
                : "border-line bg-white hover:border-ink"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}