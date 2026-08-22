"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/fashion/cart-context";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";

export function OrderBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { fc } = useFashionCopy();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/fashion/auth")
      .then((r) => r.json())
      .then((data) => setLoggedIn(Boolean(data.customer)))
      .catch(() => setLoggedIn(false));
  }, [pathname]);

  const accountHref = loggedIn ? "/account" : "/account/login";
  const accountLabel = loggedIn ? fc.nav.account : fc.nav.login;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8d4e8]/70 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(74,51,72,0.08)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 items-end px-2 pt-1.5">
        <BottomLink href="/collections" label="Category" active={pathname.startsWith("/collections")}>
          <MenuIcon />
        </BottomLink>
        <div className="flex justify-center">
          <Link
            href="/"
            aria-label="Home"
            className={`-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#9d6b8a,#c9a0b8)] text-white shadow-lg ${
              pathname === "/" ? "ring-4 ring-[#e8c4d8]/60" : ""
            }`}
          >
            <HomeIcon />
          </Link>
        </div>
        <BottomLink href="/cart" label={`${fc.nav.cart} (${itemCount})`} active={pathname.startsWith("/cart") || pathname.startsWith("/checkout")}>
          <CartIcon />
        </BottomLink>
        <BottomLink href={accountHref} label={accountLabel} active={pathname.startsWith("/account")}>
          <UserIcon />
        </BottomLink>
      </div>
    </nav>
  );
}

function BottomLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold ${
        active ? "text-[#5c3d5e]" : "text-[#8a7490]"
      }`}
    >
      {children}
      <span className="max-w-[4.5rem] truncate text-center leading-tight">{label}</span>
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="20" r="1.5" fill="currentColor" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
