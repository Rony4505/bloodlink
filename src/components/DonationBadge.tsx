"use client";

import {
  badgeToneClass,
  getDonationBadge,
  type DonationBadgeTier,
} from "@/lib/donation-badges";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  count: number;
  /** Show even when count is 0 */
  showEmpty?: boolean;
};

function labelFor(
  tier: DonationBadgeTier,
  t: Record<string, string>,
): string | null {
  if (tier === "legend") return t.donationBadgeLegend;
  if (tier === "hero") return t.donationBadgeHero;
  if (tier === "lifesaver") return t.donationBadgeLifesaver;
  if (tier === "helper") return t.donationBadgeHelper;
  if (tier === "first") return t.donationBadgeFirst;
  return null;
}

export function DonationBadge({ count, showEmpty = false }: Props) {
  const { t } = useLocale();
  const info = getDonationBadge(count);
  if (info.tier === "none" && !showEmpty) return null;
  const label = labelFor(info.tier, t as unknown as Record<string, string>);
  if (!label && !showEmpty) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${badgeToneClass(info.tier || "first")}`}
      title={`${t.donationCountLabel}: ${info.count}`}
    >
      <svg aria-hidden viewBox="0 0 12 16" className="h-3 w-2.5" fill="currentColor">
        <path d="M6 0C6 0 0 7 0 10.5A6 6 0 0 0 12 10.5C12 7 6 0 6 0Z" />
      </svg>
      {label ? <span>{label}</span> : null}
      <span className="opacity-90">×{info.count}</span>
    </span>
  );
}
