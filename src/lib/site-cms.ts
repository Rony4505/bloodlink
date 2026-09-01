import type {
  BannerPage,
  BannerPlacement,
  BannerSize,
  OrgBanner,
  SiteAppearance,
  SuccessStory,
} from "./types";

export const DEFAULT_HERO_BACKGROUND =
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1280&q=55";

export const DEFAULT_LOGO_URL = "/bloodlink-logo.png";

/** Official BloodLink BD Facebook page (admin can override in site appearance). */
export const DEFAULT_FACEBOOK_URL = "https://www.facebook.com/bloodlinkbd.org";

export function defaultSuccessStories(): SuccessStory[] {
  return [
    {
      id: "story-karim",
      name: "Karim",
      handle: "@karim_hussain_88",
      quoteEn:
        "We needed blood in an emergency. Through BloodLink BD, I found a donor very quickly. Thank you everyone.",
      quoteBn:
        "জরুরি মুহূর্তে রক্ত দরকার ছিল। BloodLink BD-এর মাধ্যমে খুব দ্রুত ডোনার পেয়েছি। সবাইকে ধন্যবাদ।",
      enabled: true,
    },
    {
      id: "story-nasira",
      name: "Nasira Begum",
      handle: "@nasira_begum",
      quoteEn:
        "My sister needed blood for her operation. Through this platform, I easily found a blood donor.",
      quoteBn:
        "অপারেশনের জন্য বোনের রক্ত দরকার ছিল। এই প্ল্যাটফর্মের মাধ্যমে সহজেই রক্তদাতা পেয়েছি।",
      enabled: true,
    },
    {
      id: "story-rafiq",
      name: "Rafiq Hasan",
      handle: "@rafiq_feni",
      quoteEn:
        "Posted a need at night and got responses from nearby donors. BloodLink really works when every minute counts.",
      quoteBn:
        "রাতে রক্তের প্রয়োজন পোস্ট করেছিলাম, কাছাকাছি ডোনাররা সাড়া দিয়েছে। প্রতি মিনিট যখন গুরুত্বপূর্ণ, BloodLink সত্যিই কাজ করে।",
      enabled: true,
    },
  ];
}

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
  "healthcare",
  "all",
];

export const BANNER_PLACEMENTS: BannerPlacement[] = [
  "after-hero",
  "mid-content",
  "before-footer",
];

/** Full-width advertisement banner dimensions shown in admin + public UI. */
export const AD_BANNER_WIDTH = 820;
export const AD_BANNER_HEIGHT = 150;
export const AD_BANNER_ASPECT = `${AD_BANNER_WIDTH}/${AD_BANNER_HEIGHT}` as const;

export const BANNER_SLIDE_INTERVAL_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 15] as const;
export const DEFAULT_BANNER_SLIDE_INTERVAL_SEC = 3;

export function normalizeBannerSlideIntervalSec(raw: unknown): number {
  const n = Math.round(Number(raw));
  return (BANNER_SLIDE_INTERVAL_OPTIONS as readonly number[]).includes(n)
    ? n
    : DEFAULT_BANNER_SLIDE_INTERVAL_SEC;
}

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
    founderPhotoUrl: "",
    facebookUrl: DEFAULT_FACEBOOK_URL,
    successStories: defaultSuccessStories(),
  };
}

function normalizeSuccessStories(raw: unknown): SuccessStory[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultSuccessStories();
  const stories = raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const s = item as Partial<SuccessStory>;
      const name = String(s.name || "").trim();
      const quoteEn = String(s.quoteEn || "").trim();
      const quoteBn = String(s.quoteBn || "").trim();
      if (!name || (!quoteEn && !quoteBn)) return null;
      return {
        id: String(s.id || `story-${index}`),
        name,
        handle: String(s.handle || "").trim(),
        quoteEn,
        quoteBn,
        enabled: s.enabled !== false,
      } satisfies SuccessStory;
    })
    .filter(Boolean) as SuccessStory[];
  return stories.length ? stories : defaultSuccessStories();
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
    founderPhotoUrl: String(raw.founderPhotoUrl || "").trim(),
    facebookUrl: String(raw.facebookUrl || base.facebookUrl).trim() || base.facebookUrl,
    successStories: normalizeSuccessStories(raw.successStories),
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
