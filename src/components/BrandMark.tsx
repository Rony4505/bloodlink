"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

type BrandMarkProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
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
}: BrandMarkProps) {
  const { t } = useLocale();
  const dims = sizes[size];
  const textClass =
    variant === "light"
      ? "text-white drop-shadow-sm"
      : "text-[var(--blood-deep)]";

  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <Image
        src="/bloodlink-logo.png"
        alt="BloodLink logo"
        width={dims.box}
        height={dims.box}
        className="rounded-full bg-white/95 object-cover shadow-sm"
        priority
      />
      {showWordmark ? (
        <span
          className={`font-[family-name:var(--font-display)] font-bold tracking-tight ${dims.text} ${textClass}`}
        >
          {t.brand}
        </span>
      ) : null}
    </Link>
  );
}
