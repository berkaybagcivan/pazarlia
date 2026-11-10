export const FULFILLMENT_LABELS = {
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
} as const;

export const FULFILLMENT_STYLES = {
  PREPARING: "bg-sun text-ink",
  SHIPPED: "bg-lilac text-ink",
  DELIVERED: "bg-mint-soft text-mint-ink",
} as const;

export type FulfillmentKey = keyof typeof FULFILLMENT_LABELS;

export const CARRIERS = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "PTT Kargo",
  "Sürat Kargo",
  "Hepsijet",
  "UPS",
  "Diğer",
] as const;

// Bir satıcının aynı siparişteki kalemlerinin ortak durumu
export function groupStatus(items: { fulfillment: FulfillmentKey }[]): FulfillmentKey {
  if (items.some((i) => i.fulfillment === "PREPARING")) return "PREPARING";
  if (items.some((i) => i.fulfillment === "SHIPPED")) return "SHIPPED";
  return "DELIVERED";
}