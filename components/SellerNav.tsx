"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/satici", label: "Genel bakış", exact: true },
  { href: "/satici/urunler", label: "Ürünler", exact: false },
  { href: "/satici/siparisler", label: "Siparişler", exact: false },
];

export default function SellerNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Satıcı paneli" className="flex gap-2 overflow-x-auto">
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