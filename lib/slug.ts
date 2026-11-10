const MAP: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
};

export function slugify(text: string, fallback = "kategori") {
  return (
    text
      .toLocaleLowerCase("tr-TR")
      .replace(/[çğıöşüâîû]/g, (c) => MAP[c])
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || fallback
  );
}