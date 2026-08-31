"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteAppearance } from "@/components/SiteAppearanceProvider";

type BrandMarkProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const sizes = {
  sm: { box: 36, text: "text-xl" },
  md: { box: 44, text: "text-2xl" },
  lg: { box: 72, text: "text-5xl md:text-6xl" },
};

export function BrandMark({
  variant = "light",
  size = "md",
  showWordmark = true,
  className = "",
}: BrandMarkProps) {
  const { brand, logoUrl } = useSiteAppearance();
  const dims = sizes[size];
  const textClass =
    variant === "light"
      ? "text-white drop-shadow-sm"
      : "text-[var(--blood-deep)]";
  const isLocalLogo =
    logoUrl.startsWith("/") && !logoUrl.startsWith("/api/");

  return (
    <Link
      href="/"
      className={`inline-flex min-w-0 shrink-0 items-center gap-2.5 ${className}`}
    >
      {isLocalLogo ? (
        <Image
          src={logoUrl}
          alt={`${brand} logo`}
          width={dims.box}
          height={dims.box}
          className="rounded-full bg-white/95 object-cover shadow-sm"
          priority
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${brand} logo`}
          width={dims.box}
          height={dims.box}
          className="rounded-full bg-white/95 object-cover shadow-sm"
          style={{ width: dims.box, height: dims.box }}
        />
      )}
      {showWordmark ? (
        <span
          className={`truncate font-[family-name:var(--font-display)] font-bold tracking-tight ${dims.text} ${textClass}`}
        >
          {brand}
        </span>
      ) : null}
    </Link>
  );
}
