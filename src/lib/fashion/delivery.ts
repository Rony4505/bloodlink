import type { DeliveryRule, StoreSettings } from "./types";

export function calculateDeliveryFee(
  settings: StoreSettings,
  district: string,
  subtotalAfterDiscount: number,
): number {
  if (!district?.trim()) return 0;

  const rules = settings.deliveryRules.filter((rule) => rule.active);
  const districtRule = rules.find(
    (rule) => rule.district.toLowerCase() === district.trim().toLowerCase(),
  );
  const fallbackRule = rules.find((rule) => rule.district === "*");
  const rule = districtRule ?? fallbackRule;

  if (!rule) return 120;
  if (rule.minOrderForFree && subtotalAfterDiscount >= rule.minOrderForFree) return 0;
  return rule.fee;
}

export function listActiveDeliveryRules(settings: StoreSettings): DeliveryRule[] {
  return settings.deliveryRules.filter((rule) => rule.active);
}
