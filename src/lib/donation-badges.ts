export type DonationBadgeTier =
  | "none"
  | "first"
  | "helper"
  | "lifesaver"
  | "hero"
  | "legend";

export type DonationBadgeInfo = {
  tier: DonationBadgeTier;
  count: number;
  /** Visual stars on the premium medal (1–3). */
  stars: number;
  /** i18n key suffix used with dictionaries */
  labelKey:
    | "donationBadgeFirst"
    | "donationBadgeHelper"
    | "donationBadgeLifesaver"
    | "donationBadgeHero"
    | "donationBadgeLegend"
    | null;
};

/** How many medal stars to show from donation count (max 3, matching badge art). */
export function starsForDonationCount(count: number): number {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n >= 5) return 3;
  if (n >= 3) return 2;
  if (n >= 1) return 1;
  return 0;
}

/** Badge tiers by lifetime donation count (BloodLink / Community heroes). */
export function getDonationBadge(count: number): DonationBadgeInfo {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const stars = starsForDonationCount(n);
  if (n >= 25) {
    return { tier: "legend", count: n, stars, labelKey: "donationBadgeLegend" };
  }
  if (n >= 10) {
    return { tier: "hero", count: n, stars, labelKey: "donationBadgeHero" };
  }
  if (n >= 5) {
    return {
      tier: "lifesaver",
      count: n,
      stars,
      labelKey: "donationBadgeLifesaver",
    };
  }
  if (n >= 3) {
    return { tier: "helper", count: n, stars, labelKey: "donationBadgeHelper" };
  }
  if (n >= 1) {
    return { tier: "first", count: n, stars, labelKey: "donationBadgeFirst" };
  }
  return { tier: "none", count: 0, stars: 0, labelKey: null };
}

export function badgeToneClass(tier: DonationBadgeTier): string {
  switch (tier) {
    case "legend":
      return "bg-[linear-gradient(120deg,#6e1220,#c45c26)] text-white";
    case "hero":
      return "bg-[color-mix(in_oklab,var(--blood)_22%,white)] text-[var(--blood-deep)]";
    case "lifesaver":
      return "bg-[color-mix(in_oklab,#2f6b4f_18%,white)] text-[#245a40]";
    case "helper":
      return "bg-[color-mix(in_oklab,#3d6a9e_16%,white)] text-[#2a4d73]";
    case "first":
      return "bg-[color-mix(in_oklab,#c45c26_14%,white)] text-[#8a3a12]";
    default:
      return "";
  }
}
