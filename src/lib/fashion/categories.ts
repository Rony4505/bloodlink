import type { Category } from "./types";
import { defaultCategories } from "./defaults";

export const categories = defaultCategories;

export function getCategorySync(slug: string): Category | undefined {
  return defaultCategories.find((category) => category.slug === slug);
}
