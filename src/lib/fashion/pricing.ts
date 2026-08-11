import type { Product, StoreSettings } from "./types";

export function computeSellPrice(
  buyPrice: number,
  settings: StoreSettings,
  product?: Pick<Product, "pricingMode" | "markupPercent" | "price">,
): number {
  const mode = product?.pricingMode ?? settings.pricingMode;
  if (mode === "manual" && product?.price) return product.price;
  const markup = product?.markupPercent ?? settings.defaultMarkupPercent;
  return Math.round(buyPrice * (1 + markup / 100));
}

export function applyOfferPrice(product: Product): number {
  if (product.offerActive && product.offerDiscountPercent) {
    return Math.round(product.price * (1 - product.offerDiscountPercent / 100));
  }
  return product.price;
}

export function getEffectivePrice(product: Product): number {
  return applyOfferPrice(product);
}
