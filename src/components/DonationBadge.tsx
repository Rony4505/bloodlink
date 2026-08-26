"use client";

import { getDonationBadge } from "@/lib/donation-badges";
import { useLocale } from "@/lib/i18n/locale-context";

type Props = {
  count: number;
  /** Show even when count is 0 */
  showEmpty?: boolean;
  /** Larger medal for profile headers */
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
}: {
  x: number;
  y: number;
  scale?: number;
}) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      fill="#F5C518"
      d="M0,-4.2 L1.2,-1.3 L4.4,-1.1 L1.9,0.9 L2.7,4 L0,2.2 L-2.7,4 L-1.9,0.9 L-4.4,-1.1 L-1.2,-1.3 Z"
    />
  );
}

/** Premium gold/navy/red medal — star count follows donation count (max 3). */
export function DonationBadge({
  count,
  showEmpty = false,
  size = "sm",
  className = "",
}: Props) {
  const { t } = useLocale();
  const info = getDonationBadge(count);

  if (info.tier === "none" && !showEmpty) return null;

  const stars = info.stars;
  const dim = size === "md" ? "h-10 w-9" : "h-7 w-6";
  const title = `${t.donationCountLabel}: ${info.count}${
    stars ? ` · ${stars}★` : ""
  }`;

  return (
    <span
      className={`inline-flex shrink-0 items-center align-middle ${className}`}
      title={title}
      aria-label={title}
    >
      <svg
        viewBox="0 0 64 78"
        className={`${dim} drop-shadow-[0_1px_2px_rgba(20,30,60,0.28)]`}
        aria-hidden
      >
        <path
          fill="#E11D2E"
          d="M20 46 L14 74 L20 69.5 L26 74 Z M32 48 L27.5 76.5 L32 72 L36.5 76.5 Z M44 46 L38 74 L44 69.5 L50 74 Z"
        />
        <path d={MEDAL_RIM} fill="#F5C518" />
        <circle cx="32" cy="30" r="18.5" fill="#0B1F3A" />
        <circle
          cx="32"
          cy="30"
          r="17"
          fill="none"
          stroke="#F5C518"
          strokeWidth="1.6"
        />
        {stars === 1 ? <Star x={32} y={26} scale={1.15} /> : null}
        {stars === 2 ? (
          <>
            <Star x={25} y={27} scale={1} />
            <Star x={39} y={27} scale={1} />
          </>
        ) : null}
        {stars >= 3 ? (
          <>
            <Star x={22.5} y={28} scale={0.95} />
            <Star x={32} y={24.5} scale={1.15} />
            <Star x={41.5} y={28} scale={0.95} />
          </>
        ) : null}
        <rect x="20" y="36" width="24" height="10" rx="3" fill="#F5C518" />
        <text
          x="32"
          y="43.5"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="700"
          fill="#0B1F3A"
          fontFamily="system-ui, sans-serif"
        >
          ×{info.count}
        </text>
      </svg>
    </span>
  );
}
