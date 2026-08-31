"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";

type BrandMarkProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  premium?: boolean;
  className?: string;
};

const sizes = {
  sm: { height: 36, text: "text-xl", logoClass: "h-9 w-auto" },
  md: { height: 44, text: "text-2xl", logoClass: "h-11 w-auto" },
  lg: { height: 88, text: "text-5xl md:text-7xl", logoClass: "h-16 w-auto md:h-[5.5rem]" },
};

function splitBrand(brand: string) {
  if (brand.endsWith("Link")) {
    return { lead: brand.slice(0, -4), tail: "Link" };
  }
  return { lead: brand, tail: "" };
}

function PremiumWordmark({
  brand,
  variant,
  textClass,
}: {
  brand: string;
  variant: "light" | "dark";
  textClass: string;
}) {
  const { lead, tail } = splitBrand(brand);
  const tone = variant === "light" ? "light" : "dark";

  if (!tail) {
    return (
      <span
        className={`brand-wordmark-premium brand-wordmark-premium-${tone} truncate font-[family-name:var(--font-display)] font-bold tracking-tight ${textClass}`}
      >
        {brand}
      </span>
    );
  }

  return (
    <span
      className={`brand-wordmark-premium truncate font-[family-name:var(--font-display)] font-bold tracking-tight ${textClass}`}
    >
      <span className={`brand-wordmark-blood brand-wordmark-blood-${tone}`}>{lead}</span>
      <span className={`brand-wordmark-link brand-wordmark-link-${tone}`}>{tail}</span>
    </span>
  );
}

export function BrandMark({
  variant = "light",
  size = "md",
  showWordmark = true,
  premium = false,
  className = "",
}: BrandMarkProps) {
  const { brand, logoUrl } = useSiteAppearance();
  const dims = sizes[size];
  const isLocalLogo =
    logoUrl.startsWith("/") && !logoUrl.startsWith("/api/");

  const logoNode = isLocalLogo ? (
    <Image
      src={logoUrl}
      alt={`${brand} logo`}
      width={dims.height}
      height={dims.height}
      className={`${dims.logoClass} object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.28)]`}
      priority={size === "lg"}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={`${brand} logo`}
      className={`${dims.logoClass} object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.28)]`}
      decoding="async"
    />
  );

  return (
    <Link
      href="/"
      className={`inline-flex min-w-0 shrink-0 items-center gap-3 md:gap-4 ${className}`}
    >
      {logoNode}
      {showWordmark ? (
        premium ? (
          <PremiumWordmark brand={brand} variant={variant} textClass={dims.text} />
        ) : (
          <span
            className={`truncate font-[family-name:var(--font-display)] font-bold tracking-tight ${dims.text} ${
              variant === "light"
                ? "text-white drop-shadow-sm"
                : "text-[var(--blood-deep)]"
            }`}
          >
            {brand}
          </span>
        )
      ) : null}
    </Link>
  );
}
