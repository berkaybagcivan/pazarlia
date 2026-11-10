"use client";

import { useRef, useState } from "react";

const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  initial: string[];
  onBusyChange?: (busy: boolean) => void;
};

export default function ImageUploader({ initial, onBusyChange }: Props) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function setBusyState(value: boolean) {
    setBusy(value);
    onBusyChange?.(value);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_FILES - urls.length;
    if (room <= 0) {
      setError(`En fazla ${MAX_FILES} görsel ekleyebilirsin.`);
      return;
    }
    setError(files.length > room ? `En fazla ${MAX_FILES} görsel ekleyebilirsin.` : null);

    setBusyState(true);
    const added: string[] = [];
    for (const file of files.slice(0, room)) {
      if (file.size > MAX_BYTES) {
        setError(`“${file.name}” 5 MB’dan büyük.`);
        continue;
      }
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch("/api/satici/gorsel", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Görsel yüklenemedi.");
          continue;
        }
        added.push(data.url);
      } catch {
        setError("Bağlantı hatası, görsel yüklenemedi.");
      }
    }
    setUrls((prev) => [...prev, ...added]);
    setBusyState(false);
  }

  function remove(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    setUrls((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  }

  return (
    <div>
      {urls.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      {urls.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {urls.map((url, i) => (
            <li key={url}>
              <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-paper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-ink">
                    Kapak
                  </span>
                )}
              </div>
              <div className="mt-1 flex justify-between gap-1 text-xs font-semibold">
                {i > 0 ? (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="text-muted hover:text-ink"
                  >
                    Kapak yap
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-muted hover:text-coral"
                >
                  Kaldır
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={onPick}
      />
      <button
        type="button"
        disabled={busy || urls.length >= MAX_FILES}
        onClick={() => inputRef.current?.click()}
        className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-ink disabled:opacity-60"
      >
        {busy ? "Yükleniyor..." : "Görsel ekle"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-coral-dark">
          {error}
        </p>
      )}
    </div>
  );
}