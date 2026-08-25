import type { Product } from "./types";

/** Verified Unsplash IDs that return HTTP 200 (seed catalog had several dead links). */
export const WORKING_FASHION_STOCK_IMAGES = [
  "photo-1515372039744-b8f02a3ae446",
  "photo-1566174053879-31528523f8ae",
  "photo-1434389677669-e08b4cac3105",
  "photo-1490481651871-ab68de25d43d",
] as const;

const BROKEN_TO_WORKING: Record<string, string> = {
  "photo-1595777457582-31a4f8e1a5c5": WORKING_FASHION_STOCK_IMAGES[0],
  "photo-1485968579580-b6d5abeba69e": WORKING_FASHION_STOCK_IMAGES[2],
  "photo-1610032344697-1c227c0d9d88": WORKING_FASHION_STOCK_IMAGES[1],
  "photo-1496747613176-916222140a94": WORKING_FASHION_STOCK_IMAGES[3],
  "photo-1581044777556-408782e03625": WORKING_FASHION_STOCK_IMAGES[0],
  "photo-1583391732137-1b8c2f5c9a2d": WORKING_FASHION_STOCK_IMAGES[1],
  "photo-1539533018447-63fcce267608": WORKING_FASHION_STOCK_IMAGES[2],
};

export const FASHION_IMAGE_UPLOAD_HINT_BN =
  "সেরা সাইজ: 900×1200 px (3:4), JPG/WebP, 500 KB-এর নিচে।";
export const FASHION_IMAGE_UPLOAD_HINT_EN =
  "Best size: 900×1200 px (3:4), JPG/WebP, under 500 KB.";

export function fashionStockImage(id: string): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1200&q=80`;
}

export function repairProductImageUrl(url: string | undefined | null): string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return fashionStockImage(WORKING_FASHION_STOCK_IMAGES[0]);

  for (const [broken, working] of Object.entries(BROKEN_TO_WORKING)) {
    if (trimmed.includes(broken)) {
      return trimmed.replace(broken, working);
    }
  }
  return trimmed;
}

export function repairProductImages(product: Product): boolean {
  let changed = false;
  const nextUrl = repairProductImageUrl(product.imageUrl);
  if (product.imageUrl !== nextUrl) {
    product.imageUrl = nextUrl;
    changed = true;
  }

  const urls = (product.imageUrls?.length ? product.imageUrls : [product.imageUrl]).map(
    repairProductImageUrl,
  );
  const deduped = [...new Set(urls.filter(Boolean))];
  const prev = (product.imageUrls ?? []).join("|");
  const next = deduped.join("|");
  if (prev !== next) {
    product.imageUrls = deduped;
    if (deduped[0] && product.imageUrl !== deduped[0]) {
      product.imageUrl = deduped[0];
    }
    changed = true;
  }
  return changed;
}

export function repairStoreProductImages(
  products: Product[],
): boolean {
  let changed = false;
  for (const product of products) {
    if (repairProductImages(product)) changed = true;
  }
  return changed;
}
