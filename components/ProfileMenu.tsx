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

  // Menü açıkken sayfanın başka bir yerine veya ESC tuşuna basıldığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Hep görünür olan profil resmi butonu */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-sun transition"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Hesap menüsü"
      >
        <Avatar name={name} image={image} />
      </button>

      {/* Tıklandığında açılan panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-white py-2 text-ink shadow-lg z-50">
          <div className="border-b border-line px-4 py-2.5 mb-1">
            <p className="truncate text-sm font-bold text-ink">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>

          <Link
            href="/hesabim"
            className="block px-4 py-2 text-sm text-ink hover:bg-paper transition"
            onClick={() => setIsOpen(false)}
          >
            Hesabım
          </Link>

          <Link
            href="/hesabim#siparisler"
            className="block px-4 py-2 text-sm text-ink hover:bg-paper transition"
            onClick={() => setIsOpen(false)}
          >
            Siparişlerim
          </Link>

          <Link
            href="/satici"
            className="block px-4 py-2 text-sm text-ink hover:bg-paper transition"
            onClick={() => setIsOpen(false)}
          >
            {isSeller ? "Mağazam" : "Mağaza Aç"}
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="block px-4 py-2 text-sm font-semibold text-coral hover:bg-paper transition"
              onClick={() => setIsOpen(false)}
            >
              Yönetim Paneli
            </Link>
          )}

          <div className="mt-1 border-t border-line pt-1">
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