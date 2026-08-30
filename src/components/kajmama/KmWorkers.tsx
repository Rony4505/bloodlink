"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, DISTRICTS, KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { kmApi } from "@/lib/kajmama/client";
import type { PublicUser } from "@/lib/kajmama/types";
import { useKm } from "./KmSession";
import { KmAvatar, KmEmpty, KmPremium, KmSkill, KmStars, KmVerified } from "./KmUi";

const PAGE_SIZE = 6;
const EXP_RANGES = [
  { id: "lt1", bn: "১ বছরের কম", en: "< 1 year", test: (n: number) => n < 1 },
  { id: "1-3", bn: "১–৩ বছর", en: "1–3 years", test: (n: number) => n >= 1 && n <= 3 },
  { id: "3-5", bn: "৩–৫ বছর", en: "3–5 years", test: (n: number) => n > 3 && n <= 5 },
  { id: "5-10", bn: "৫–১০ বছর", en: "5–10 years", test: (n: number) => n > 5 && n <= 10 },
  { id: "10+", bn: "১০+ বছর", en: "10+ years", test: (n: number) => n > 10 },
];

export function KmWorkers() {
  const { t, lang } = useKm();
  const bn = lang === "bn";
  const params = useSearchParams();
  const [category, setCategory] = useState(params.get("category") || "");
  const [district, setDistrict] = useState(params.get("district") || "");
  const [area, setArea] = useState(params.get("area") || "");
  const [q, setQ] = useState(params.get("q") || "");
  const [sort, setSort] = useState("premium");
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [ratings, setRatings] = useState<number[]>([]);
  const [exps, setExps] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [workers, setWorkers] = useState<PublicUser[] | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (category) sp.set("category", category);
    if (district) sp.set("district", district);
    if (q) sp.set("q", q);
    let cancelled = false;
    kmApi<{ workers: PublicUser[] }>(`/api/kajmama/workers?${sp.toString()}`)
      .then((d) => {
        if (!cancelled) setWorkers(d.workers);
      })
      .catch(() => {
        if (!cancelled) setWorkers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [category, district, q]);

  const filtered = useMemo(() => {
    let list = workers || [];
    const areaQ = area.trim().toLowerCase();
    if (areaQ) list = list.filter((w) => w.area.toLowerCase().includes(areaQ));
    if (premiumOnly) list = list.filter((w) => w.verified);
    if (ratings.length) {
      const min = Math.min(...ratings);
      list = list.filter((w) => (w.rating || 0) >= min);
    }
    if (exps.length) {
      const testers = EXP_RANGES.filter((r) => exps.includes(r.id));
      list = list.filter((w) => testers.some((r) => r.test(w.experienceYears)));
    }
    const next = [...list];
    if (sort === "rating") next.sort((a, b) => b.rating - a.rating);
    else if (sort === "exp") next.sort((a, b) => b.experienceYears - a.experienceYears);
    else next.sort((a, b) => Number(b.verified) - Number(a.verified) || b.rating - a.rating);
    return next;
  }, [workers, area, premiumOnly, ratings, exps, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pages);
  const slice = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  function toggle<T>(list: T[], v: T, set: (n: T[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
    setPage(1);
  }

  function reset() {
    setRatings([]);
    setExps([]);
    setPremiumOnly(false);
    setArea("");
    setSort("premium");
    setPage(1);
  }

  return (
    <div className="km-page km-wrap">
      <div className="km-results-bar">
        <div>
          <p className="km-kicker-dark">{bn ? "সার্চ রেজাল্ট" : "Search results"}</p>
          <h1>
            {bn ? "মোট পাওয়া গেছে" : "Found"}: {workers ? filtered.length : "—"} {bn ? "জন" : ""}
          </h1>
        </div>
        <div className="km-filters km-filters-inline">
          <select
            className="km-select"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{bn ? "কাজের ধরন" : "Job type"}</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {bn ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>
          <select
            className="km-select"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{bn ? "জেলা" : "District"}</option>
            {DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <input
            className="km-input"
            placeholder={bn ? "এলাকা (ঐচ্ছিক)" : "Area (optional)"}
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setPage(1);
            }}
          />
          <select className="km-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="premium">{bn ? "প্রিমিয়াম আগে" : "Premium first"}</option>
            <option value="rating">{bn ? "রেটিং" : "Rating"}</option>
            <option value="exp">{bn ? "অভিজ্ঞতা" : "Experience"}</option>
          </select>
          <input
            className="km-input"
            placeholder={bn ? "নাম খুঁজুন" : "Search name"}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <span className="km-btn dark sm">{t.applyFilter}</span>
        </div>
      </div>

      <div className="km-results-layout">
        <aside className="km-side-filters">
          <h3>{bn ? "ফিল্টার" : "Filters"}</h3>
          <p className="km-side-label">{bn ? "রেটিং" : "Rating"}</p>
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} className="km-checkrow">
              <input
                type="checkbox"
                checked={ratings.includes(n)}
                onChange={() => toggle(ratings, n, setRatings)}
              />
              <span className="km-stars">
                {"★".repeat(n)}
                <span className="off">{"★".repeat(5 - n)}</span>
              </span>
              {n.toFixed(1)}
            </label>
          ))}
          <p className="km-side-label">{bn ? "অভিজ্ঞতা (বছর)" : "Experience"}</p>
          {EXP_RANGES.map((r) => (
            <label key={r.id} className="km-checkrow">
              <input type="checkbox" checked={exps.includes(r.id)} onChange={() => toggle(exps, r.id, setExps)} />
              {bn ? r.bn : r.en}
            </label>
          ))}
          <label className="km-toggle-row">
            <span>{bn ? "শুধুমাত্র প্রিমিয়াম" : "Premium only"}</span>
            <input type="checkbox" checked={premiumOnly} onChange={(e) => setPremiumOnly(e.target.checked)} />
          </label>
          <button type="button" className="km-btn dark sm" onClick={reset}>
            {t.resetFilter}
          </button>
        </aside>

        <div>
          {workers === null ? <p className="km-muted">{bn ? "খুঁজছি…" : "Searching…"}</p> : null}
          {workers && filtered.length === 0 ? (
            <KmEmpty
              title={bn ? "এখন কেউ নেই" : "No one yet"}
              hint={bn ? "ফিল্টার বদলান, অথবা নিজে প্রোফাইল খুলুন।" : "Change filters, or open a profile."}
              href={`${KAJMAMA_BASE}/register`}
              cta={bn ? "প্রোফাইল খুলুন" : "Sign up"}
            />
          ) : null}
          {slice.length > 0 ? (
            <div className="km-list">
              {slice.map((w) => (
                <Link key={w.id} href={`${KAJMAMA_BASE}/workers/${w.id}`} className={`km-card km-worker-list ${w.verified ? "is-premium" : ""}`}>
                  <KmPremium on={w.verified} />
                  <KmAvatar name={w.name} id={w.id} size={78} />
                  <div>
                    <h3>
                      {w.name} <KmVerified on={w.verified} />
                    </h3>
                    <div className="km-chips">
                      {w.skills.map((s) => (
                        <KmSkill key={s} id={s} />
                      ))}
                    </div>
                    <p className="km-meta">
                      📍 {w.area}, {w.district} · <KmStars value={w.rating || 4.5} /> {(w.rating || 4.5).toFixed(1)}{" "}
                      {w.reviewCount ? `(${w.reviewCount})` : ""} · 💼 {w.experienceYears}
                      {bn ? " বছর" : " yrs"}
                    </p>
                    <p className={`km-avail ${w.available ? "on" : ""}`}>
                      <i /> {w.available ? "Available" : bn ? "Busy" : "Busy"}
                    </p>
                  </div>
                  <div className="km-call-col">
                    <p className="km-phone">{w.phone || w.phoneMasked}</p>
                    <span className="km-btn dark sm">{t.call}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
          {filtered.length > PAGE_SIZE ? (
            <div className="km-pager">
              <button type="button" disabled={pageSafe <= 1} onClick={() => setPage(pageSafe - 1)}>
                {bn ? "পূর্ববর্তী" : "Previous"}
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={n === pageSafe ? "on" : ""} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
              <button type="button" disabled={pageSafe >= pages} onClick={() => setPage(pageSafe + 1)}>
                {bn ? "পরবর্তী" : "Next"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
