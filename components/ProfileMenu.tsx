"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { logout } from "@/app/actions/auth";

type ProfileMenuProps = {
  name: string;
  email: string;
  image?: string | null;
  isSeller?: boolean;
  isAdmin?: boolean;
};

export default function ProfileMenu({
  name,
  email,
  image,
  isSeller,
  isAdmin,
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-line bg-white p-1 pr-3 text-sm font-semibold hover:border-ink transition focus:outline-none"
      >
        <Avatar
          name={name}
          email={email}
          image={image}
          className="h-8 w-8 text-xs"
        />
        <span className="max-w-[120px] truncate">{name || email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-white py-2 shadow-lg z-50">
          <div className="border-b border-line px-4 py-2.5">
            <p className="truncate text-sm font-bold text-ink">{name || "Üye"}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/hesabim"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-ink hover:bg-paper transition"
            >
              Hesabım
            </Link>
            <Link
              href="/hesabim#favoriler"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-ink hover:bg-paper transition"
            >
              Favorilerim
            </Link>
            <Link
              href="/hesabim#siparisler"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-ink hover:bg-paper transition"
            >
              Siparişlerim
            </Link>

            {isSeller ? (
              <Link
                href="/satici"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm font-semibold text-coral hover:bg-paper transition"
              >
                Satıcı Paneli
              </Link>
            ) : (
              <Link
                href="/satici"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-paper transition"
              >
                Mağaza Aç
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm font-semibold text-ink hover:bg-paper transition"
              >
                Yönetim Paneli
              </Link>
            )}
          </div>

          <div className="border-t border-line pt-1">
            <form action={logout}>
              <button
                type="submit"
                className="w-full px-4 py-2 text-left text-sm font-semibold text-coral hover:bg-paper transition"
              >
                Çıkış yap
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}