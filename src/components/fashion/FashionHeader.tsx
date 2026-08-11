"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/fashion/cart-context";
import { cn } from "@/lib/fashion/cn";

const links = [
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function FashionHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const isDark = variant === "dark";

  return (
    <header
      className={cn(
        "flex flex-col gap-5 rounded-full border px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-7",
        isDark
          ? "border-white/15 bg-white/8 text-white"
          : "border-black/8 bg-white/90 text-[#241815] shadow-[0_18px_60px_rgba(48,27,20,0.06)]",
      )}
    >
      <Link href="/" className="group">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[0.2em] uppercase">
          Nooré Dhaka
        </p>
        <p className={cn("mt-1 text-sm", isDark ? "text-white/75" : "text-[#7a5c50]")}>
          Luxury womenswear for Bangladesh
        </p>
      </Link>

      <nav className="flex flex-wrap items-center gap-3 text-sm">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1.5 transition",
                isDark
                  ? active
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10"
                  : active
                    ? "bg-[#f4e6dd] text-[#2b1d19]"
                    : "text-[#6f554a] hover:bg-[#faf4f0]",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/cart"
          className={cn(
            "rounded-full px-4 py-1.5 font-semibold transition",
            isDark
              ? "bg-white text-[#2b1d19] hover:bg-white/90"
              : "bg-[#2b1d19] text-white hover:bg-[#3a2924]",
          )}
        >
          Cart{itemCount > 0 ? ` (${itemCount})` : ""}
        </Link>
      </nav>
    </header>
  );
}
