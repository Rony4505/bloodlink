"use client";

import { getDonationBadge, medalPalette } from "@/lib/donation-badges";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  count: number;
  showEmpty?: boolean;
  size?: "sm" | "md";
  className?: string;
};

function scallopPath(cx: number, cy: number, outer: number, inner: number, spikes = 16) {
  const parts: string[] = [];
  for (let i = 0; i < spikes * 2; i += 1) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${parts.join(" ")} Z`;
}

const MEDAL_RIM = scallopPath(32, 30, 27.5, 23.2, 16);

function Star({
  x,
  y,
  scale = 1,
  fill,
}: {
  x: number;
  y: number;
  scale?: number;
  fill: string;
}) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill={fill}
      d="M0,-4.2 L1.2,-1.3 L4.4,-1.1 L1.9,0.9 L2.7,4 L0,2.2 L-2.7,4 L-1.9,0.9 L-4.4,-1.1 L-1.2,-1.3 Z"
    />
  );
}

function metalLabel(
  key: DonationBadgeInfoLabel,
  t: Record<string, string>,
): string {
  if (key === "donationBadgePlatinum") return t.donationBadgePlatinum || "Platinum";
  if (key === "donationBadgeGold") return t.donationBadgeGold || "Gold";
  if (key === "donationBadgeSilver") return t.donationBadgeSilver || "Silver";
  if (key === "donationBadgeBronze") return t.donationBadgeBronze || "Bronze";
  return "";
}

type DonationBadgeInfoLabel =
  | "donationBadgePlatinum"
  | "donationBadgeGold"
  | "donationBadgeSilver"
  | "donationBadgeBronze"
  | null;

/**
 * Premium medal (platinum/gold/silver/bronze by donation count)
 * + clear readable donation count text beside it.
 */
export function DonationBadge({
  count,
  showEmpty = false,
  size = "sm",
  className = "",
}: Props) {
  const { t } = useLocale();
  const info = getDonationBadge(count);

  if (info.tier === "none" && !showEmpty) return null;

  const palette = medalPalette(info.metal);
  const stars = info.stars;
  const dim = size === "md" ? "h-10 w-9" : "h-7 w-6";
  const label = info.labelKey
    ? metalLabel(info.labelKey, t as unknown as Record<string, string>)
    : "";
  const title = `${label || t.donationCountLabel}: ${info.count}`;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 align-middle ${className}`}
      title={title}
      aria-label={title}
    >
      <svg
        viewBox="0 0 64 78"
        className={`${dim} drop-shadow-[0_1px_2px_rgba(20,30,60,0.28)]`}
        aria-hidden
      >
        <path
          fill={palette.ribbon}
          d="M20 46 L14 74 L20 69.5 L26 74 Z M32 48 L27.5 76.5 L32 72 L36.5 76.5 Z M44 46 L38 74 L44 69.5 L50 74 Z"
        />
        <path d={MEDAL_RIM} fill={palette.rim} />
        <circle cx="32" cy="30" r="18.5" fill={palette.disc} />
        <circle
          cx="32"
          cy="30"
          r="17"
          fill="none"
          stroke={palette.ring}
          strokeWidth="1.6"
        />
        {stars === 1 ? <Star x={32} y={27} scale={1.15} fill={palette.star} /> : null}
        {stars === 2 ? (
          <>
            <Star x={25} y={28} scale={1} fill={palette.star} />
            <Star x={39} y={28} scale={1} fill={palette.star} />
          </>
        ) : null}
        {stars >= 3 ? (
          <>
            <Star x={22.5} y={29} scale={0.95} fill={palette.star} />
            <Star x={32} y={25.5} scale={1.15} fill={palette.star} />
            <Star x={41.5} y={29} scale={0.95} fill={palette.star} />
          </>
        ) : null}
      </svg>
      <span className="inline-flex flex-col leading-none">
        {label ? (
          <span className="text-[9px] font-bold uppercase tracking-wide text-[color-mix(in_oklab,var(--ink)_55%,white)]">
            {label}
          </span>
        ) : null}
        <span className="text-xs font-bold tabular-nums text-[var(--blood-deep)] sm:text-sm">
          ×{info.count}
        </span>
      </span>
    </span>
  );
}
