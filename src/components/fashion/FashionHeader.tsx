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
  const [unread, setUnread] = useState(0);
  const isDark = variant === "dark";

  useEffect(() => {
    fetch("/api/fashion/auth")
      .then((r) => r.json())
      .then((data) => setLoggedIn(Boolean(data.customer)))
      .catch(() => setLoggedIn(false));

    fetch("/api/fashion/notifications")
      .then((r) => r.json())
      .then((data) => {
        const count = (data.notifications ?? []).filter(
          (n: { readBy?: string[] }) => !n.readBy?.length,
        ).length;
        setUnread(count);
      })
      .catch(() => setUnread(0));
  }, [pathname]);

  const activeClass = isDark
    ? "bg-[linear-gradient(135deg,rgba(244,212,194,0.28),rgba(255,255,255,0.12))] text-white ring-1 ring-[#f4d4c2]/35 shadow-[0_4px_20px_rgba(244,212,194,0.15)]"
    : "bg-[linear-gradient(135deg,#2b1d19,#6b4a3d)] text-[#f4d4c2] shadow-[0_4px_16px_rgba(43,29,25,0.2)]";

  const idleClass = isDark
    ? "text-white/80 hover:bg-white/10 hover:text-white"
    : "text-[#6f554a] hover:bg-[#faf4f0] hover:text-[#2b1d19]";

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
                  "rounded-full px-3.5 py-1.5 font-medium transition duration-200",
                  active ? activeClass : idleClass,
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {loggedIn ? (
            <Link
              href="/account"
              className={cn(
                "relative rounded-full px-3.5 py-1.5 font-medium transition duration-200",
                pathname.startsWith("/account") ? activeClass : idleClass,
              )}
            >
              {copy.nav.account}
              {unread > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c99286] text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>
          ) : (
            <Link
              href="/account/login"
              className={cn("rounded-full px-3.5 py-1.5 font-medium transition duration-200", idleClass)}
            >
              {copy.nav.login}
            </Link>
          )}
          <Link
            href="/cart"
            className={cn(
              "rounded-full px-4 py-1.5 font-semibold transition",
              isDark
                ? "bg-white text-[#2b1d19] hover:bg-white/90"
                : "bg-[linear-gradient(135deg,#2b1d19,#4a322c)] text-[#f4d4c2] hover:opacity-90",
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
