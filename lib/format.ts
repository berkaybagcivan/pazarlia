export function formatPrice(kurus: number) {
  return (kurus / 100).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
  });
}