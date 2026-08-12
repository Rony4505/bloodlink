"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/fashion/cart-context";
import { cn } from "@/lib/fashion/cn";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import { copy } from "@/lib/fashion/copy";

export function FashionHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { fc, locale } = useFashionCopy();
  const [loggedIn, setLoggedIn] = useState(false);
  const [unread, setUnread] = useState(0);
  const [myMenuOpen, setMyMenuOpen] = useState(false);
  const [brand, setBrand] = useState(copy.brand);
  const [tagline, setTagline] = useState(copy.tagline);
  const menuRef = useRef<HTMLDivElement>(null);
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
        if (data.settings?.brandTagline) {
          const tag =
            locale === "en" && data.settings.brandTaglineEn
              ? data.settings.brandTaglineEn
              : data.settings.brandTagline;
          setTagline(tag);
        }
      })
      .catch(() => undefined);
  }, [pathname, locale]);

  useEffect(() => {
    setMyMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMyMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const activeClass = isDark
    ? "bg-[linear-gradient(135deg,#f0c9a8,#f8e4d4)] text-[#5c3d5e] ring-2 ring-[#f4d4c2]/70 shadow-[0_4px_18px_rgba(240,201,168,0.45)]"
    : "bg-[linear-gradient(135deg,#f0c9a8,#f8e4d4)] text-[#5c3d5e] ring-2 ring-[#e8b896]/60 shadow-[0_4px_16px_rgba(232,184,150,0.35)]";

  const idleClass = isDark
    ? "text-[#5c3d5e]/90 hover:bg-white/40 hover:text-[#4a3348]"
    : "text-[#7a5c50] hover:bg-[#faf0ea] hover:text-[#5c3d5e]";

  const links = [{ href: "/collections", label: fc.nav.collections }];

  const myProductActive =
    pathname.startsWith("/account") || pathname.startsWith("/track");

  return (
    <header
      className={cn(
        "rounded-[2rem] border px-5 py-4 backdrop-blur md:px-7",
        isDark
          ? "border-[#e8d4e8]/60 bg-white/75 text-[#4a3348] shadow-[0_18px_60px_rgba(122,85,128,0.08)]"
          : "border-[#e8d4c4]/50 bg-white/92 text-[#4a3348] shadow-[0_18px_60px_rgba(122,85,128,0.06)]",
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="group min-w-0 shrink-0">
          <p className="truncate font-[family-name:var(--font-display)] text-xl font-bold tracking-[0.16em] uppercase md:text-2xl">
            {brand}
          </p>
          <p className={cn("mt-1 truncate text-sm", isDark ? "text-[#6e5870]" : "text-[#7a5c50]")}>
            {tagline}
          </p>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm md:gap-3">
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

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMyMenuOpen((open) => !open)}
              className={cn(
                "rounded-full px-3.5 py-1.5 font-medium transition duration-200",
                myProductActive || myMenuOpen ? activeClass : idleClass,
              )}
            >
              {fc.nav.myProduct}
              {loggedIn && unread > 0 ? (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9859a] px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </button>
            {myMenuOpen ? (
              <div className="absolute left-0 top-full z-30 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[#e8d4e8]/70 bg-white py-2 shadow-[0_20px_50px_rgba(90,60,95,0.12)]">
                <Link
                  href="/account"
                  className="block px-4 py-2.5 text-[#4a3348] transition hover:bg-[#faf0f5]"
                  onClick={() => setMyMenuOpen(false)}
                >
                  {fc.nav.myOrders}
                </Link>
                <Link
                  href="/track"
                  className="block px-4 py-2.5 text-[#4a3348] transition hover:bg-[#faf0f5]"
                  onClick={() => setMyMenuOpen(false)}
                >
                  {fc.nav.track}
                </Link>
              </div>
            ) : null}
          </div>

          {loggedIn ? (
            <Link
              href="/account"
              className={cn(
                "rounded-full px-3.5 py-1.5 font-medium transition duration-200",
                pathname.startsWith("/account") ? activeClass : idleClass,
              )}
            >
              {fc.nav.account}
            </Link>
          ) : (
            <Link
              href="/account/login"
              className={cn(
                "rounded-full px-3.5 py-1.5 font-medium transition duration-200",
                pathname === "/account/login" ? activeClass : idleClass,
              )}
            >
              {fc.nav.login}
            </Link>
          )}

          <Link
            href="/cart"
            className={cn(
              "rounded-full px-4 py-1.5 font-semibold transition",
              "bg-[linear-gradient(135deg,#9d6b8a,#c9a0b8)] text-white hover:opacity-90 shadow-md",
            )}
          >
            {fc.nav.cart}
            {itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
