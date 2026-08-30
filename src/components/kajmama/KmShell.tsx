"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { useKm } from "./KmSession";
import "./kajmama.css";

export function KmShell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, user, logout } = useKm();
  const pathname = usePathname();
  const on = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "on" : "");

  return (
    <div className="km-shell">
      <header className="km-nav">
        <div className="km-nav-inner">
          <Link href={KAJMAMA_BASE} className="km-logo">
            <span className="km-logo-mark">কা</span>
            <span>
              <strong>{t.brand}</strong>
              <em>{t.tagline}</em>
            </span>
          </Link>
          <nav className="km-links">
            <Link className={on(`${KAJMAMA_BASE}/workers`)} href={`${KAJMAMA_BASE}/workers`}>
              {t.workers}
            </Link>
            <Link className={on(`${KAJMAMA_BASE}/jobs`)} href={`${KAJMAMA_BASE}/jobs`}>
              {t.jobs}
            </Link>
            {user ? (
              <Link className={on(`${KAJMAMA_BASE}/dashboard`)} href={`${KAJMAMA_BASE}/dashboard`}>
                {t.dashboard}
              </Link>
            ) : null}
          </nav>
          <div className="km-nav-end">
            <button
              type="button"
              className="km-lang"
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            >
              {lang === "bn" ? "EN" : "বাং"}
            </button>
            {user ? (
              <>
                <Link href={`${KAJMAMA_BASE}/dashboard`} className="km-ghost-link">
                  {user.name.split(" ")[0]}
                </Link>
                <button type="button" className="km-btn ghost sm" onClick={() => void logout()}>
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link href={`${KAJMAMA_BASE}/login`} className="km-btn ghost sm">
                  {t.login}
                </Link>
                <Link href={`${KAJMAMA_BASE}/register`} className="km-btn gold sm">
                  {t.register}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="km-main">{children}</main>
      <footer className="km-footer">
        <p>{t.footer}</p>
        <Link href={`${KAJMAMA_BASE}/admin`}>Admin</Link>
      </footer>
    </div>
  );
}
