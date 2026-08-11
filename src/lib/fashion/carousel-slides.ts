import type { PromoBanner } from "@/lib/fashion/types";

export type CarouselSlide = {
  id: string;
  imageUrl: string;
  href: string;
  label?: string;
  badge?: string;
};

/** Homepage carousel shows only admin-added advertisements. */
export function buildCarouselSlides(banners: PromoBanner[]): CarouselSlide[] {
  return banners
    .filter((b) => b.active !== false && Boolean(b.imageUrl))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((b) => ({
      id: b.id,
      imageUrl: b.imageUrl,
      href: b.linkSlug ? `/products/${b.linkSlug}` : "/collections",
      label: b.title,
      badge: b.badgeLabel ?? "অ্যাড",
    }));
}
