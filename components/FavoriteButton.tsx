"use client";

import { useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorite";

export default function FavoriteButton({
  productId,
  initialFavorited,
}: {
  productId: string;
  initialFavorited: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(() => {
          toggleFavorite(productId);
        });
      }}
      aria-label={initialFavorited ? "Favorilerden çıkar" : "Favorilere ekle"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white/90 text-coral shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white disabled:opacity-50"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={initialFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}