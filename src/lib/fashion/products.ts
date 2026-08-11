import { seedProducts } from "./seed-products";

export {
  listProducts,
  getProductBySlug,
  getFeaturedProducts,
  getProductsByCategory,
  getRelatedProducts,
} from "./store";

export { seedProducts, seedProducts as products };

export function getProduct(slug: string) {
  return seedProducts.find((product) => product.slug === slug);
}

export function getRelatedProductsSync(
  product: { id: string; categorySlug: string },
  limit = 4,
) {
  return seedProducts
    .filter(
      (item) => item.categorySlug === product.categorySlug && item.id !== product.id,
    )
    .slice(0, limit);
}
