"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { KAJMAMA_BASE } from "@/lib/kajmama/constants";
import type { Category, PublicUser } from "@/lib/kajmama/types";
import { kmApi } from "@/lib/kajmama/client";
import { peopleCount } from "@/lib/kajmama/format";
import { useKm } from "./KmSession";
import { KmAdSlot } from "./KmAds";
import { KmAvatar, KmPremium, KmStars } from "./KmUi";

type HomeData = {
  categories: Category[];
  featuredWorkers: PublicUser[];
  stats: { workers: number; jobs: number; completed: number };
};

function matchCategory(c: Category, q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  return `${c.nameBn} ${c.nameEn} ${c.blurbBn} ${c.blurbEn} ${c.id}`.toLowerCase().includes(n);
}

export function KmLanding() {
  const { t, lang, user, meta } = useKm();
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");

  useEffect(() => {
    kmApi<HomeData>("/api/kajmama")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const bn = lang === "bn";
  const filtered = useMemo(
    () => (data?.categories || []).filter((c) => matchCategory(c, q)),
    [data, q],
  );
  const shown = q.trim() ? filtered : filtered.slice(0, 8);
  const postHref = user
    ? `${KAJMAMA_BASE}/jobs/new`
    : `${KAJMAMA_BASE}/register?role=hirer&next=${encodeURIComponent(`${KAJMAMA_BASE}/jobs/new`)}`;

  function search(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (category) sp.set("category", category);
    if (district) sp.set("district", district);
    if (upazila) sp.set("upazila", upazila);
    router.push(`${KAJMAMA_BASE}/workers?${sp.toString()}`);
  }

  return (
    <>
      <section className="km-hero">
        <div className="km-wrap km-hero-grid">
          <div>
            <h1>{t.heroTitle}</h1>
            <p className="lead">{t.heroLead}</p>
            <form className="km-hero-search" onSubmit={search}>
              <label className="km-search-field">
                <span>💼 {bn ? "কাজের ধরন" : "Job type"}</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t.searchCategory}>
                  <option value="">{t.searchCategory}</option>
                  {(data?.categories || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {bn ? c.nameBn : c.nameEn} ({peopleCount(c.workerCount || 0, bn)})
                    </option>
                  ))}
                </select>
              </label>
              <label className="km-search-field">
                <span>📍 {bn ? "জেলা" : "District"}</span>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setUpazila("");
                  }}
                  aria-label={bn ? "জেলা" : "District"}
                >
                  <option value="">{bn ? "জেলা নির্বাচন করুন" : "Select district"}</option>
                  {(meta.districts.length ? meta.districts : ["ঢাকা"]).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="km-search-field">
                <span>🏘️ {bn ? "উপজেলা" : "Upazila"}</span>
                <select value={upazila} onChange={(e) => setUpazila(e.target.value)}>
                  <option value="">{bn ? "উপজেলা" : "Upazila"}</option>
                  {(meta.upazilas[district] || []).map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </label>
              <button className="km-btn gold km-search-go" type="submit">
                🔍 {bn ? "খুঁজুন" : "Search"}
              </button>
            </form>
            <div className="km-trust-row">
              <span>✓ {bn ? "যাচাইকৃত মিস্ত্রি" : "Verified workers"}</span>
              <span>✓ {bn ? "হাজারো সন্তুষ্ট গ্রাহক" : "Thousands of happy clients"}</span>
              <span>✓ {bn ? "দ্রুত সেবা" : "Fast service"}</span>
              <span>✓ {bn ? "২৪/৭ সহায়তা" : "24/7 support"}</span>
            </div>
            <div className="km-cta" style={{ marginTop: "1.1rem" }}>
              <Link className="km-btn gold" href={postHref}>
                {t.postJob}
              </Link>
              <Link className="km-btn light" href={`${KAJMAMA_BASE}/workers`}>
                {t.findWorker}
              </Link>
            </div>
          </div>
          <div className="km-hero-man" role="img" aria-label={bn ? "বিশ্বস্ত মিস্ত্রি" : "Trusted worker"} />
        </div>
      </section>

      <div className="km-wrap">
        <KmAdSlot placement="home_hero" />
      </div>

      <div className="km-wrap">
        <div className="km-stats-bar">
          <div>
            <b>{data?.stats.workers ?? "—"}+</b>
            {bn ? "নিবন্ধিত কর্মী" : "registered workers"}
          </div>
          <div>
            <b>{data?.stats.jobs ?? "—"}</b>
            {bn ? "খোলা কাজ" : "open jobs"}
          </div>
          <div>
            <b>৬৪</b>
            {bn ? "জেলা কভার" : "districts covered"}
          </div>
          <div>
            <b>৪.৮/৫</b>
            {bn ? "গড় রেটিং" : "avg rating"}
          </div>
        </div>
      </div>

      <section className="km-section km-wrap" id="categories">
        <div className="km-page-head">
          <div>
            <h2>{bn ? "কাজের ধরন অনুযায়ী খুঁজুন" : "Browse by job type"}</h2>
            <p className="km-muted">
              {bn ? "ক্যাটাগরি বেছে নিন — প্রতিটায় কতজন কর্মী আছে দেখা যাবে।" : "Pick a category — each shows how many workers are listed."}
            </p>
          </div>
        </div>
        <input
          className="km-input km-cat-filter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={bn ? "প্লাম্বার, এসি, ক্লিনিং…" : "Plumber, AC, cleaning…"}
        />
        {filtered.length === 0 ? (
          <p className="km-muted">{bn ? "এই নামে ক্যাটাগরি নেই।" : "No category matches."}</p>
        ) : (
          <div className="km-cats">
            {shown.map((c) => (
              <Link key={c.id} className="km-cat" href={`${KAJMAMA_BASE}/workers?category=${c.id}`}>
                <span className="km-cat-top">
                  <span className="ico">{c.icon}</span>
                </span>
                <b>{bn ? c.nameBn : c.nameEn}</b>
                <span className="km-count">{peopleCount(c.workerCount || 0, bn)}</span>
              </Link>
            ))}
            {!q.trim() && filtered.length > 8 ? (
              <Link className="km-cat km-cat-more" href={`${KAJMAMA_BASE}/workers`}>
                <span className="km-cat-top">
                  <span className="ico">⋯</span>
                </span>
                <b>{t.seeMore}</b>
              </Link>
            ) : null}
          </div>
        )}
      </section>

      <div className="km-wrap">
        <KmAdSlot placement="home_categories" />
      </div>

      <section className="km-post-band">
        <div className="km-wrap km-post-inner">
          <div>
            <h2>{bn ? "কাজের মানুষ লাগবে?" : "Need a worker?"}</h2>
            <p>{bn ? "৩০ সেকেন্ডে কাজ পোস্ট করুন। কাছের মিস্ত্রিরা আগ্রহ দেখাবে।" : "Post a job in 30 seconds. Nearby workers can respond."}</p>
          </div>
          <Link className="km-btn gold" href={postHref}>
            {t.postJob}
          </Link>
        </div>
      </section>

      <section className="km-section km-wrap">
        <div className="km-page-head">
          <div>
            <h2>👑 {bn ? "প্রিমিয়াম কর্মী" : "Premium workers"}</h2>
            <p className="km-muted">{bn ? "ভেরিফায়েড ও উচ্চ রেটিংসম্পন্ন।" : "Verified, highly rated people."}</p>
          </div>
          <Link className="km-seeall" href={`${KAJMAMA_BASE}/workers`}>
            {t.seeAll} →
          </Link>
        </div>
        <div className="km-grid-3">
          {(data?.featuredWorkers || []).slice(0, 3).map((w) => {
            const skill = meta.categories.find((c) => c.id === w.skills[0]);
            return (
              <Link key={w.id} href={`${KAJMAMA_BASE}/workers/${w.id}`} className="km-card km-worker-h">
                <KmPremium on={w.premium} />
                <KmAvatar name={w.name} id={w.id} size={92} />
                <div>
                  <h3>{w.name}</h3>
                  <p className="km-jobline">{skill ? (bn ? skill.nameBn : skill.nameEn) : ""}</p>
                  <p className="km-meta">
                    📍 {w.area}, {w.district}
                  </p>
                  <p className="km-meta">
                    <KmStars value={w.rating || 4.8} /> {w.rating ? w.rating.toFixed(1) : "4.8"}{" "}
                    {w.reviewCount ? `(${w.reviewCount})` : "(12)"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="km-wrap">
        <KmAdSlot placement="home_premium" />
      </div>

      <section className="km-section km-wrap" id="how">
        <h2>{t.how}</h2>
        <p className="km-muted">{t.trust}</p>
        <div className="km-steps">
          <article className="km-step">
            <i>১</i>
            <h3>{bn ? "কাজের ধরন বেছে নিন" : "Pick a job type"}</h3>
            <p className="km-muted">{bn ? "ক্যাটাগরি বা জেলা দিয়ে খুঁজুন, অথবা কাজ পোস্ট করুন।" : "Search by type and district, or post the job."}</p>
          </article>
          <article className="km-step">
            <i>২</i>
            <h3>{bn ? "ভেরিফায়েড মিস্ত্রি দেখুন" : "See verified people"}</h3>
            <p className="km-muted">{bn ? "রেটিং, অভিজ্ঞতা ও এলাকা মিলিয়ে বেছে নিন।" : "Compare rating, experience, and area."}</p>
          </article>
          <article className="km-step">
            <i>৩</i>
            <h3>{bn ? "কাজ শেষ, ওয়েবসাইটে পেমেন্ট, তারপর রিভিউ" : "Finish, pay on the site, then review"}</h3>
            <p className="km-muted">{bn ? "সাইটের বাইরে লেনদেন নয়। পেমেন্ট হলে তবেই রেটিং ও পরের কাজ।" : "No off-site deals. Payment unlocks ratings and the next job."}</p>
          </article>
        </div>
      </section>
    </>
  );
}
