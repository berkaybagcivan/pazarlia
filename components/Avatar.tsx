"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  email: string;
  image?: string | null;
  className?: string;
};

export default function Avatar({
  name,
  email,
  image,
  className = "h-10 w-10 text-base",
}: Props) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Sayfa yüklenirken hata verip React bağlanmadan bozulan görselleri yakalar
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [image]);

  const initial = (name || email).charAt(0).toLocaleUpperCase("tr-TR");

  if (image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-sun font-extrabold text-ink ${className}`}
    >
      {initial}
    </span>
  );
}