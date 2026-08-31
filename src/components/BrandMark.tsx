"use client";

import Link from "next/link";
import { BRAND_LOGO_URL } from "@/lib/site-cms";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";

type BrandMarkProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  /** @deprecated Always uses premium lockup styling now. */
  premium?: boolean;
  className?: string;
};

const sizes = {
  sm: {
    logo: "h-9 w-auto",
    text: "text-[1.25rem] md:text-[1.35rem]",
    gap: "gap-2.5",
  },
  md: {
    logo: "h-11 w-auto",
    text: "text-[1.5rem] md:text-[1.65rem]",
    gap: "gap-3",
  },
  lg: {
    logo: "h-[5.25rem] w-auto sm:h-[6.25rem] md:h-[7.75rem]",
    text: "text-[2.35rem] sm:text-[2.85rem] md:text-[4.35rem]",
    gap: "gap-3.5 md:gap-5",
  },
};

export function BrandMark({
  variant = "light",
  size = "md",
  showWordmark = true,
  className = "",
}: BrandMarkProps) {
  const { brand } = useSiteAppearance();
  const dims = sizes[size];
  const tone = variant === "light" ? "light" : "dark";

  return (
    <Link
      href="/"
      className={`brand-lockup brand-lockup-${tone} inline-flex min-w-0 shrink-0 items-center ${dims.gap} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_LOGO_URL}
        alt={`${brand} logo`}
        width={251}
        height={334}
        className={`brand-lockup-logo ${dims.logo} shrink-0 object-contain`}
        decoding="async"
        fetchPriority={size === "lg" ? "high" : "auto"}
      />
      {showWordmark ? (
        <span className={`brand-wordmark brand-wordmark-${tone} truncate ${dims.text}`}>
          {brand}
        </span>
      ) : null}
    </Link>
  );
}
