import type { Product, PromoBanner } from "@/lib/fashion/types";

export type CarouselSlide = {
  id: string;
  imageUrl: string;
  href: string;
  label?: string;
  badge?: string;
};

export function buildCarouselSlides(
  banners: PromoBanner[],
  offers: Product[],
  newProducts: Product[],
): CarouselSlide[] {
  const slides: CarouselSlide[] = banners.map((b) => ({
    id: b.id,
    imageUrl: b.imageUrl,
    href: b.linkSlug ? `/products/${b.linkSlug}` : "/collections",
    label: b.title,
    badge: "অফার",
  }));

  for (const product of offers) {
    slides.push({
      id: `offer-${product.id}`,
      imageUrl: product.imageUrl,
      href: `/products/${product.slug}`,
      label: product.offerLabel ?? product.nameBn,
      badge: product.offerDiscountPercent ? `${product.offerDiscountPercent}% ছাড়` : "অফার",
    });
  }

  for (const product of newProducts.slice(0, 4)) {
    if (slides.some((s) => s.id === `offer-${product.id}`)) continue;
    slides.push({
      id: `new-${product.id}`,
      imageUrl: product.imageUrl,
      href: `/products/${product.slug}`,
      label: product.nameBn,
      badge: "নতুন",
    });
  }

  return slides;
}
