"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { useKm } from "./KmSession";
import { KmAdSlot } from "./KmAds";
import { KmBell } from "./KmBell";
import { KmChatWidget } from "./KmChatWidget";
import { KmLogoMark } from "./KmUi";
import "./kajmama.css";

export function KmShell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, user, logout, meta } = useKm();
  const pathname = usePathname();
  const homeOn = pathname === KAJMAMA_BASE || pathname === `${KAJMAMA_BASE}/`;
  const on = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "on" : "");
  const postHref = user
    ? `${KAJMAMA_BASE}/jobs/new`
    : `${KAJMAMA_BASE}/register?role=hirer&next=${encodeURIComponent(`${KAJMAMA_BASE}/jobs/new`)}`;

  return (
    <div className="km-shell">
      <header className="km-nav">
        <div className="km-nav-inner">
          <Link href={KAJMAMA_BASE} className="km-logo">
            <KmLogoMark />
            <span>
              <strong>{t.brand}</strong>
              <em>{t.tagline}</em>
            </span>
          </Link>
          <nav className="km-links">
            <Link className={homeOn ? "on" : ""} href={KAJMAMA_BASE}>
              {t.home}
            </Link>
            <Link className={on(`${KAJMAMA_BASE}/workers`)} href={`${KAJMAMA_BASE}/workers`}>
              {t.allWorkers}
            </Link>
            <Link className={on(`${KAJMAMA_BASE}/jobs`)} href={postHref}>
              {t.needWorkers}
            </Link>
          </nav>
          <div className="km-nav-end">
            <Link href={`${KAJMAMA_BASE}/admin`} className={`km-ghost-link ${on(`${KAJMAMA_BASE}/admin`)}`}>
              {t.admin}
            </Link>
            <KmBell />
            <button type="button" className="km-lang" onClick={() => setLang(lang === "bn" ? "en" : "bn")}>
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
      {meta.ads.some((a) => a.placement === "all_pages") ? (
        <div className="km-ad-banner">
          <div className="km-wrap">
            <KmAdSlot placement="all_pages" />
          </div>
        </div>
      ) : null}
      <main className="km-main">{children}</main>
      <footer className="km-footer" id="contact">
        <div className="km-wrap km-foot-grid km-foot-simple">
          <div>
            <Link href={KAJMAMA_BASE} className="km-logo km-foot-brand">
              <KmLogoMark size={40} />
              <span>
                <strong>{t.brand}</strong>
                <em>{t.tagline}</em>
              </span>
            </Link>
            <p>{t.footer}</p>
          </div>
          <div>
            <h4>{lang === "bn" ? "লিংক" : "Links"}</h4>
            <Link href={KAJMAMA_BASE}>{t.home}</Link>
            <Link href={`${KAJMAMA_BASE}/workers`}>{t.allWorkers}</Link>
            <Link href={postHref}>{t.needWorkers}</Link>
            <Link href={`${KAJMAMA_BASE}/admin`}>{t.admin}</Link>
          </div>
          <div>
            <h4>{t.contact}</h4>
            <p>{meta.contact.phone}</p>
            <p>{meta.contact.email}</p>
          </div>
        </div>
        <div className="km-copybar">
          <div className="km-wrap km-copy">
            <span>
              © {new Date().getFullYear()} KajMama BD. {lang === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}
            </span>
          </div>
        </div>
      </footer>
      <KmChatWidget />
    </div>
  );
}
