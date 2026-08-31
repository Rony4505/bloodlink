"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_URL } from "@/lib/site-cms";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";

type BrandMarkProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  premium?: boolean;
  className?: string;
};

const sizes = {
  sm: { height: 36, text: "text-[1.35rem]", logoClass: "h-9 w-auto" },
  md: { height: 44, text: "text-[1.65rem]", logoClass: "h-11 w-auto" },
  lg: {
    height: 96,
    text: "text-[2.65rem] md:text-[4.25rem]",
    logoClass: "h-[4.5rem] w-auto md:h-[6rem]",
  },
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

  return (
    <span
      className={`brand-wordmark brand-wordmark-${tone} truncate font-[family-name:var(--font-brand)] font-extrabold ${textClass}`}
    >
      <span className="brand-wordmark-main">{lead}</span>
      {tail ? <span className="brand-wordmark-accent">{tail}</span> : null}
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
  const resolvedLogo = logoUrl || BRAND_LOGO_URL;
  const isLocalLogo =
    resolvedLogo.startsWith("/") && !resolvedLogo.startsWith("/api/");

  const logoNode = isLocalLogo ? (
    <Image
      src={resolvedLogo}
      alt={`${brand} logo`}
      width={dims.height}
      height={Math.round(dims.height * 1.39)}
      className={`${dims.logoClass} object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.32)]`}
      priority={size === "lg"}
      unoptimized
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedLogo}
      alt={`${brand} logo`}
      className={`${dims.logoClass} object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.32)]`}
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
            className={`truncate font-[family-name:var(--font-brand)] font-extrabold tracking-[-0.04em] ${dims.text} ${
              variant === "light"
                ? "text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
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
