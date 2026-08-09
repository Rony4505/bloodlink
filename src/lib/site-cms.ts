import type {
  BannerPage,
  BannerPlacement,
  BannerSize,
  OrgBanner,
  SiteAppearance,
} from "./types";

export const DEFAULT_HERO_BACKGROUND =
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=2000&q=80";

export const DEFAULT_LOGO_URL = "/bloodlink-logo.png";

export const BANNER_SIZES: BannerSize[] = [
  "sm",
  "md",
  "lg",
  "leaderboard",
  "square",
];

export const BANNER_PAGES: BannerPage[] = [
  "home",
  "find",
  "requests",
  "about",
  "ambulance",
  "all",
];

export const BANNER_PLACEMENTS: BannerPlacement[] = [
  "after-hero",
  "mid-content",
  "before-footer",
];

export const BANNER_SIZE_CLASS: Record<BannerSize, string> = {
  sm: "h-12 max-w-[160px]",
  md: "h-16 max-w-[220px]",
  lg: "h-24 max-w-[320px]",
  leaderboard: "h-20 w-full max-w-3xl",
  square: "h-40 w-40",
};

export function defaultSiteAppearance(): SiteAppearance {
  return {
    logoUrl: DEFAULT_LOGO_URL,
    heroBackgroundUrl: DEFAULT_HERO_BACKGROUND,
    brand: "",
    taglineEn: "",
    taglineBn: "",
    heroSupportEn: "",
    heroSupportBn: "",
    aboutTitleEn: "",
    aboutTitleBn: "",
    aboutBodyEn: "",
    aboutBodyBn: "",
  };
}

export function normalizeSiteAppearance(raw?: Partial<SiteAppearance> | null): SiteAppearance {
  const base = defaultSiteAppearance();
  if (!raw || typeof raw !== "object") return base;
  return {
    logoUrl: String(raw.logoUrl || base.logoUrl).trim() || base.logoUrl,
    heroBackgroundUrl:
      String(raw.heroBackgroundUrl || base.heroBackgroundUrl).trim() ||
      base.heroBackgroundUrl,
    brand: String(raw.brand || "").trim(),
    taglineEn: String(raw.taglineEn || "").trim(),
    taglineBn: String(raw.taglineBn || "").trim(),
    heroSupportEn: String(raw.heroSupportEn || "").trim(),
    heroSupportBn: String(raw.heroSupportBn || "").trim(),
    aboutTitleEn: String(raw.aboutTitleEn || "").trim(),
    aboutTitleBn: String(raw.aboutTitleBn || "").trim(),
    aboutBodyEn: String(raw.aboutBodyEn || "").trim(),
    aboutBodyBn: String(raw.aboutBodyBn || "").trim(),
  };
}

function asSize(value: unknown): BannerSize {
  return BANNER_SIZES.includes(value as BannerSize) ? (value as BannerSize) : "md";
}

function asPlacement(value: unknown): BannerPlacement {
  return BANNER_PLACEMENTS.includes(value as BannerPlacement)
    ? (value as BannerPlacement)
    : "mid-content";
}

function asPages(value: unknown): BannerPage[] {
  if (!Array.isArray(value) || value.length === 0) return ["home"];
  const pages = value
    .map((p) => String(p))
    .filter((p): p is BannerPage => BANNER_PAGES.includes(p as BannerPage));
  return pages.length ? [...new Set(pages)] : ["home"];
}

export function normalizeBanner(raw: Partial<OrgBanner> & { id?: string; title?: string }): OrgBanner | null {
  if (!raw?.id || !raw.title) return null;
  return {
    id: String(raw.id),
    title: String(raw.title),
    imageUrl: String(raw.imageUrl || ""),
    linkUrl: String(raw.linkUrl || ""),
    enabled: Boolean(raw.enabled),
    size: asSize(raw.size),
    pages: asPages(raw.pages),
    placement: asPlacement(raw.placement),
  };
}

export function bannerMatches(
  banner: OrgBanner,
  page: BannerPage,
  placement: BannerPlacement,
): boolean {
  if (!banner.enabled) return false;
  if (banner.placement !== placement) return false;
  return banner.pages.includes("all") || banner.pages.includes(page);
}
