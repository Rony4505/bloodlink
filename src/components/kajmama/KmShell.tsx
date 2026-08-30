"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { useKm } from "./KmSession";
import { KmLogoMark } from "./KmUi";
import "./kajmama.css";

export function KmShell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, user, logout } = useKm();
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
            <Link href={`${KAJMAMA_BASE}#categories`}>{t.types}</Link>
            <Link className={on(`${KAJMAMA_BASE}/workers`)} href={`${KAJMAMA_BASE}/workers`}>
              {t.workers}
            </Link>
            <Link href={`${KAJMAMA_BASE}#how`}>{t.how}</Link>
            <Link className={on(`${KAJMAMA_BASE}/blog`)} href={`${KAJMAMA_BASE}/blog`}>
              {t.blog}
            </Link>
            <Link href="#contact">{t.contact}</Link>
          </nav>
          <div className="km-nav-end">
            <button type="button" className="km-lang" onClick={() => setLang(lang === "bn" ? "en" : "bn")}>
              {lang === "bn" ? "EN" : "বাং"}
            </button>
            {user ? (
              <>
                <Link href={`${KAJMAMA_BASE}/dashboard`} className="km-ghost-link">
                  {user.name.split(" ")[0]}
                </Link>
                <Link className="km-btn gold sm" href={postHref}>
                  {t.postJob}
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
      <footer className="km-footer" id="contact">
        <div className="km-wrap km-foot-grid">
          <div>
            <Link href={KAJMAMA_BASE} className="km-logo km-foot-brand">
              <KmLogoMark size={40} />
              <span>
                <strong>{t.brand}</strong>
                <em>{t.tagline}</em>
              </span>
            </Link>
            <p>{t.footer}</p>
            <div className="km-social" aria-label="social">
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                f
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer">
                ▶
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                in
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                Ig
              </a>
            </div>
          </div>
          <div>
            <h4>{lang === "bn" ? "দ্রুত লিংক" : "Quick links"}</h4>
            <Link href={KAJMAMA_BASE}>{t.home}</Link>
            <Link href={`${KAJMAMA_BASE}/workers`}>{t.workers}</Link>
            <Link href={`${KAJMAMA_BASE}/jobs`}>{t.jobs}</Link>
            <Link href={`${KAJMAMA_BASE}#how`}>{t.how}</Link>
            <Link href={`${KAJMAMA_BASE}/blog`}>{t.blog}</Link>
          </div>
          <div>
            <h4>{lang === "bn" ? "জনপ্রিয় কাজ" : "Popular jobs"}</h4>
            {CATEGORIES.slice(0, 6).map((c) => (
              <Link key={c.id} href={`${KAJMAMA_BASE}/workers?category=${c.id}`}>
                {lang === "bn" ? c.nameBn : c.nameEn}
              </Link>
            ))}
          </div>
          <div>
            <h4>{lang === "bn" ? "সহায়তা" : "Help"}</h4>
            <Link href={`${KAJMAMA_BASE}/jobs/new`}>{t.postJob}</Link>
            <Link href={`${KAJMAMA_BASE}/register?role=worker`}>{t.becomeWorker}</Link>
            <Link href={`${KAJMAMA_BASE}/blog`}>{lang === "bn" ? "প্রশ্নোত্তর" : "FAQ"}</Link>
            <Link href={`${KAJMAMA_BASE}/admin`}>Admin</Link>
          </div>
          <div>
            <h4>{t.contact}</h4>
            <p>01712-345678</p>
            <p>support@kajmamabd.com</p>
            <p>{lang === "bn" ? "ধানমন্ডি, ঢাকা" : "Dhanmondi, Dhaka"}</p>
          </div>
        </div>
        <div className="km-copybar">
          <div className="km-wrap km-copy">
            <span>© {new Date().getFullYear()} KajMama BD. {lang === "bn" ? "সর্বস্বত্ব সংরক্ষিত।" : "All rights reserved."}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
