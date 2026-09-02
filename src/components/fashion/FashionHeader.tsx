"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/fashion/cart-context";
import { cn } from "@/lib/fashion/cn";
import { useFashionCopy } from "@/lib/fashion/use-fashion-copy";
import { copy } from "@/lib/fashion/copy";

function NavIconButton({
  href,
  label,
  active,
  activeClass,
  idleClass,
  children,
  badge,
}: {
  href: string;
  label: string;
  active?: boolean;
  activeClass: string;
  idleClass: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full transition duration-200",
        active ? activeClass : idleClass,
      )}
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9859a] px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function FashionHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const { fc, locale } = useFashionCopy();
  const [loggedIn, setLoggedIn] = useState(false);
  const [unread, setUnread] = useState(0);
  const [myMenuOpen, setMyMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const [brand, setBrand] = useState(copy.brand);
  const [tagline, setTagline] = useState(copy.tagline);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isDark = variant === "dark";

  useEffect(() => {
    let alive = true;
    fetch("/api/fashion/auth")
      .then((r) => r.json())
      .then((data) => {
        if (alive) setLoggedIn(Boolean(data.customer));
      })
      .catch(() => {
        if (alive) setLoggedIn(false);
      });

    fetch("/api/fashion/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const count = (data.notifications ?? []).filter(
          (n: { readBy?: string[] }) => !n.readBy?.length,
        ).length;
        setUnread(count);
      })
      .catch(() => {
        if (alive) setUnread(0);
      });

    return () => {
      alive = false;
    };
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    fetch("/api/fashion/settings")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
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
    return () => {
      alive = false;
    };
  }, [locale]);

  useEffect(() => {
    setMyMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useLayoutEffect(() => {
    if (!myMenuOpen || !triggerRef.current) {
      setMenuPos(null);
      return;
    }

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(rect.width, 176),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [myMenuOpen]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMyMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    setSearchOpen(false);
  }

  const activeClass = isDark
    ? "bg-[linear-gradient(135deg,#f0c9a8,#f8e4d4)] text-[#5c3d5e] ring-2 ring-[#f4d4c2]/70 shadow-[0_4px_18px_rgba(240,201,168,0.45)]"
    : "bg-[linear-gradient(135deg,#f0c9a8,#f8e4d4)] text-[#5c3d5e] ring-2 ring-[#e8b896]/60 shadow-[0_4px_16px_rgba(232,184,150,0.35)]";

  const idleClass = isDark
    ? "text-[#5c3d5e]/90 hover:bg-white/40 hover:text-[#4a3348]"
    : "text-[#7a5c50] hover:bg-[#faf0ea] hover:text-[#5c3d5e]";

  const myProductActive =
    pathname.startsWith("/account") || pathname.startsWith("/track");

  const dropdown =
    myMenuOpen && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[500] overflow-hidden rounded-2xl border border-[#e8d4e8]/70 bg-white py-2 shadow-[0_24px_60px_rgba(90,60,95,0.22)]"
            style={{ top: menuPos.top, left: menuPos.left, minWidth: menuPos.width }}
          >
            <Link
              href="/account"
              className="block px-4 py-3 text-[#4a3348] transition hover:bg-[#faf0f5]"
              onClick={() => setMyMenuOpen(false)}
            >
              {fc.nav.myOrders}
            </Link>
            <Link
              href="/track"
              className="block px-4 py-3 text-[#4a3348] transition hover:bg-[#faf0f5]"
              onClick={() => setMyMenuOpen(false)}
            >
              {fc.nav.track}
            </Link>
          </div>,
          document.body,
        )
      : null;

  return (
    <header
      className={cn(
        "relative z-30 rounded-[2rem] border px-5 py-4 backdrop-blur md:px-7",
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

        <div className="flex flex-wrap items-center gap-2 md:gap-2.5">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="w-full min-w-[200px] flex-1 md:max-w-xs">
              <input
                autoFocus
                className="field w-full rounded-full py-2 text-sm"
                placeholder={fc.search.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
              />
            </form>
          ) : (
            <button
              type="button"
              aria-label={fc.nav.search}
              title={fc.nav.search}
              onClick={() => setSearchOpen(true)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition duration-200",
                pathname.startsWith("/search") ? activeClass : idleClass,
              )}
            >
              <SearchIcon />
            </button>
          )}

          <NavIconButton
            href="/collections"
            label={fc.nav.collections}
            active={pathname === "/collections" || pathname.startsWith("/collections/")}
            activeClass={activeClass}
            idleClass={idleClass}
          >
            <GridIcon />
          </NavIconButton>

          <div className="relative">
            <button
              ref={triggerRef}
              type="button"
              aria-label={fc.nav.myProduct}
              title={fc.nav.myProduct}
              onClick={() => setMyMenuOpen((open) => !open)}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full transition duration-200",
                myProductActive || myMenuOpen ? activeClass : idleClass,
              )}
            >
              <PackageIcon />
              {loggedIn && unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9859a] px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </button>
          </div>

          <NavIconButton
            href={loggedIn ? "/account" : "/account/login"}
            label={loggedIn ? fc.nav.account : fc.nav.login}
            active={pathname.startsWith("/account")}
            activeClass={activeClass}
            idleClass={idleClass}
          >
            <UserIcon />
          </NavIconButton>

          <NavIconButton
            href="/cart"
            label={fc.nav.cart}
            active={pathname.startsWith("/cart") || pathname.startsWith("/checkout")}
            activeClass="bg-[linear-gradient(135deg,#9d6b8a,#c9a0b8)] text-white shadow-md hover:opacity-90"
            idleClass="bg-[linear-gradient(135deg,#9d6b8a,#c9a0b8)] text-white shadow-md hover:opacity-90"
            badge={itemCount}
          >
            <CartIcon />
          </NavIconButton>
        </div>
      </div>
      {dropdown}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 20 7v10l-8 4-8-4V7l8-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 12 20 7M12 12 4 7M12 12v10" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
