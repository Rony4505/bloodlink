"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pos", label: "POS" },
  { href: "/products", label: "Products" },
  { href: "/sales", label: "Sales" },
  { href: "/settings", label: "Settings" },
];

export function AppNav({ shopName }: { shopName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(244,250,246,0.85)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="brand-mark grid h-10 w-10 place-items-center rounded-xl bg-[var(--ink)] text-[var(--lime)] display text-lg font-bold">
            L
          </div>
          <div>
            <div className="display text-xl font-semibold leading-none">{shopName}</div>
            <div className="text-xs text-[var(--ink-soft)]/70">Supershop POS</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-sm transition ${
                  active
                    ? "bg-[var(--ink)] text-[var(--lime)]"
                    : "text-[var(--ink-soft)] hover:bg-white/70"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="btn btn-ghost rounded-full px-3 py-2 text-sm"
        >
          Lock
        </button>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-[var(--line)] px-3 py-2 md:hidden">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                active
                  ? "bg-[var(--ink)] text-[var(--lime)]"
                  : "bg-white/60 text-[var(--ink-soft)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
