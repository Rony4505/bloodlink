"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/fashion/cart-context";
import { copy } from "@/lib/fashion/copy";
import { cn } from "@/lib/fashion/cn";
import { SearchBar } from "./SearchBar";

const links = [
  { href: "/collections", label: copy.nav.collections },
  { href: "/search", label: copy.nav.search },
  { href: "/about", label: copy.nav.about },
  { href: "/contact", label: copy.nav.contact },
];

export function FashionHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [loggedIn, setLoggedIn] = useState(false);
  const isDark = variant === "dark";

  useEffect(() => {
    fetch("/api/fashion/auth")
      .then((r) => r.json())
      .then((data) => setLoggedIn(Boolean(data.customer)))
      .catch(() => setLoggedIn(false));
  }, [pathname]);

  return (
    <header
      className={cn(
        "flex flex-col gap-5 rounded-[2rem] border px-5 py-4 backdrop-blur md:px-7",
        isDark
          ? "border-white/15 bg-white/8 text-white"
          : "border-black/8 bg-white/90 text-[#241815] shadow-[0_18px_60px_rgba(48,27,20,0.06)]",
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="group">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[0.2em] uppercase">
            {copy.brand}
          </p>
          <p className={cn("mt-1 text-sm", isDark ? "text-white/75" : "text-[#7a5c50]")}>
            {copy.tagline}
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
            href={loggedIn ? "/account" : "/account/login"}
            className={cn(
              "rounded-full px-3 py-1.5 transition",
              isDark ? "text-white/80 hover:bg-white/10" : "text-[#6f554a] hover:bg-[#faf4f0]",
            )}
          >
            {loggedIn ? copy.nav.account : copy.nav.login}
          </Link>
          <Link
            href="/cart"
            className={cn(
              "rounded-full px-4 py-1.5 font-semibold transition",
              isDark
                ? "bg-white text-[#2b1d19] hover:bg-white/90"
                : "bg-[#2b1d19] text-white hover:bg-[#3a2924]",
            )}
          >
            {copy.nav.cart}
            {itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
        </nav>
      </div>

      <SearchBar variant={variant} />
    </header>
  );
}
