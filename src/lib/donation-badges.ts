export type DonationMetal = "platinum" | "gold" | "silver" | "bronze" | "none";

export type DonationBadgeTier =
  | "none"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum";

export type DonationBadgeInfo = {
  tier: DonationBadgeTier;
  metal: DonationMetal;
  count: number;
  /** Visual stars on the premium medal (1–3). */
  stars: number;
  labelKey:
    | "donationBadgePlatinum"
    | "donationBadgeGold"
    | "donationBadgeSilver"
    | "donationBadgeBronze"
    | null;
};

export type MedalPalette = {
  rim: string;
  disc: string;
  ring: string;
  star: string;
  ribbon: string;
  chip: string;
  chipText: string;
};

/** How many medal stars to show from donation count (max 3). */
export function starsForDonationCount(count: number): number {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n >= 5) return 3;
  if (n >= 3) return 2;
  if (n >= 1) return 1;
  return 0;
}

/**
 * Metal tier by lifetime donation count:
 * platinum 25+, gold 10+, silver 5+, bronze 1+.
 */
export function getDonationBadge(count: number): DonationBadgeInfo {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const stars = starsForDonationCount(n);
  if (n >= 25) {
    return {
      tier: "platinum",
      metal: "platinum",
      count: n,
      stars,
      labelKey: "donationBadgePlatinum",
    };
  }
  if (n >= 10) {
    return {
      tier: "gold",
      metal: "gold",
      count: n,
      stars,
      labelKey: "donationBadgeGold",
    };
  }
  if (n >= 5) {
    return {
      tier: "silver",
      metal: "silver",
      count: n,
      stars,
      labelKey: "donationBadgeSilver",
    };
  }
  if (n >= 1) {
    return {
      tier: "bronze",
      metal: "bronze",
      count: n,
      stars,
      labelKey: "donationBadgeBronze",
    };
  }
  return { tier: "none", metal: "none", count: 0, stars: 0, labelKey: null };
}

export function medalPalette(metal: DonationMetal): MedalPalette {
  switch (metal) {
    case "platinum":
      return {
        rim: "#E8EEF5",
        disc: "#1B2430",
        ring: "#C9D4E3",
        star: "#F4F7FB",
        ribbon: "#6B7C93",
        chip: "#E8EEF5",
        chipText: "#1B2430",
      };
    case "gold":
      return {
        rim: "#F5C518",
        disc: "#0B1F3A",
        ring: "#F5C518",
        star: "#F5C518",
        ribbon: "#E11D2E",
        chip: "#F5C518",
        chipText: "#0B1F3A",
      };
    case "silver":
      return {
        rim: "#C0C6CE",
        disc: "#243041",
        ring: "#D7DCE2",
        star: "#E8ECF0",
        ribbon: "#7A8694",
        chip: "#C0C6CE",
        chipText: "#243041",
      };
    case "bronze":
      return {
        rim: "#C87941",
        disc: "#2A1A12",
        ring: "#E0A06A",
        star: "#E8B07A",
        ribbon: "#8B3A1E",
        chip: "#C87941",
        chipText: "#2A1A12",
      };
    default:
      return {
        rim: "#F5C518",
        disc: "#0B1F3A",
        ring: "#F5C518",
        star: "#F5C518",
        ribbon: "#E11D2E",
        chip: "#F5C518",
        chipText: "#0B1F3A",
      };
  }
}

/** @deprecated use metal tiers */
export function badgeToneClass(tier: DonationBadgeTier | string): string {
  switch (tier) {
    case "platinum":
    case "legend":
      return "bg-[linear-gradient(120deg,#dfe7f2,#9aafc4)] text-[#1b2430]";
    case "gold":
    case "hero":
      return "bg-[color-mix(in_oklab,#f5c518_28%,white)] text-[#7a5a00]";
    case "silver":
    case "lifesaver":
      return "bg-[color-mix(in_oklab,#c0c6ce_35%,white)] text-[#3a4552]";
    case "bronze":
    case "helper":
    case "first":
      return "bg-[color-mix(in_oklab,#c87941_22%,white)] text-[#6b3a18]";
    default:
      return "";
  }
}
