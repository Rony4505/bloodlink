"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/fashion/cart-context";
import { copy } from "@/lib/fashion/copy";
import { cn } from "@/lib/fashion/cn";

const links = [
  { href: "/collections", label: copy.nav.collections },
  { href: "/about", label: copy.nav.about },
  { href: "/contact", label: copy.nav.contact },
];

export function FashionHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [loggedIn, setLoggedIn] = useState(false);
  const [unread, setUnread] = useState(0);
  const [brand, setBrand] = useState(copy.brand);
  const [tagline, setTagline] = useState(copy.tagline);
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

    fetch("/api/fashion/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.brandName) setBrand(data.settings.brandName);
        if (data.settings?.brandTagline) setTagline(data.settings.brandTagline);
      })
      .catch(() => undefined);
  }, [pathname]);

  const activeClass = isDark
    ? "bg-[linear-gradient(135deg,#f0c9a8,#f8e4d4)] text-[#4a2f28] ring-2 ring-[#f4d4c2]/70 shadow-[0_4px_18px_rgba(240,201,168,0.45)]"
    : "bg-[linear-gradient(135deg,#f0c9a8,#f8e4d4)] text-[#4a2f28] ring-2 ring-[#e8b896]/60 shadow-[0_4px_16px_rgba(232,184,150,0.35)]";

  const idleClass = isDark
    ? "text-white/85 hover:bg-white/12 hover:text-white"
    : "text-[#7a5c50] hover:bg-[#faf0ea] hover:text-[#4a2f28]";

  return (
    <header
      className={cn(
        "rounded-[2rem] border px-5 py-4 backdrop-blur md:px-7",
        isDark
          ? "border-white/15 bg-white/8 text-white"
          : "border-[#e8d4c4]/50 bg-white/92 text-[#241815] shadow-[0_18px_60px_rgba(48,27,20,0.06)]",
      )}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="group">
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[0.2em] uppercase">
            {brand}
          </p>
          <p className={cn("mt-1 text-sm", isDark ? "text-white/75" : "text-[#7a5c50]")}>
            {tagline}
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
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#e8a598] text-[10px] font-bold text-white">
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
                ? "bg-[linear-gradient(135deg,#f0c9a8,#f8e4d4)] text-[#4a2f28] hover:opacity-90"
                : "bg-[linear-gradient(135deg,#d4a574,#f0c9a8)] text-[#3d2a24] hover:opacity-90 shadow-md",
            )}
          >
            {copy.nav.cart}
            {itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
