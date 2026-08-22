import type { ProductCategory } from "./types";

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  men: "Men",
  women: "Women",
  kids: "Kids",
  accessories: "Accessories",
  grocery: "Grocery",
  other: "Other",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[];
