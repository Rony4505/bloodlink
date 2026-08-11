import { slugify } from "@/lib/fashion/search";

const ASCII_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isAsciiProductSlug(slug: string): boolean {
  return ASCII_SLUG.test(slug);
}

export function buildProductSlug(
  input: { slug?: string; name?: string; nameBn?: string; id?: string },
  fallbackId: string,
): string {
  const candidates = [
    input.slug ? slugify(input.slug) : "",
    slugify(input.name ?? ""),
    slugify(input.nameBn ?? ""),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (isAsciiProductSlug(candidate)) return candidate;
  }

  return `product-${fallbackId.replace(/^p/, "")}`;
}
