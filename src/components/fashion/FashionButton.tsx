import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/fashion/cn";

export function FashionButton({
  href,
  children,
  variant = "primary",
  className,
  type,
  onClick,
  disabled,
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles = cn(
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition",
    variant === "primary" &&
      "bg-[#2b1d19] text-white hover:-translate-y-0.5 hover:bg-[#3a2924]",
    variant === "secondary" &&
      "border border-black/10 bg-white text-[#2b1d19] hover:bg-[#faf4f0]",
    variant === "ghost" &&
      "border border-black/10 bg-transparent text-[#2b1d19] hover:bg-[#faf4f0]",
    disabled && "cursor-not-allowed opacity-55 hover:translate-y-0",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type ?? "button"} className={styles} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
