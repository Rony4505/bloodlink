"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KAJMAMA_BASE } from "@/lib/kajmama/constants";
import type { Category, PublicUser } from "@/lib/kajmama/types";
import { kmApi } from "@/lib/kajmama/client";
import { useKm } from "./KmSession";
import { KmAvatar, KmMoney, KmSkill, KmStars, KmVerified } from "./KmUi";

type HomeData = {
  settings: { siteNameBn: string; taglineBn: string; taglineEn: string };
  categories: Category[];
  featuredWorkers: PublicUser[];
  stats: { workers: number; jobs: number; completed: number };
};

export function KmLanding() {
  const { t, lang } = useKm();
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    kmApi<HomeData>("/api/kajmama")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const bn = lang === "bn";

  return (
    <>
      <section className="km-hero">
        <div className="km-wrap km-hero-grid">
          <div>
            <p className="km-kicker">Bangladesh · marketplace</p>
            <h1>{t.tagline}</h1>
            <p className="lead">{t.heroLead}</p>
            <div className="km-cta">
              <Link className="km-btn gold" href={`${KAJMAMA_BASE}/workers`}>
                {t.findWorker}
              </Link>
              <Link className="km-btn ghost" href={`${KAJMAMA_BASE}/register`}>
                {t.becomeWorker}
              </Link>
            </div>
            <div className="km-stats">
              <div>
                <b>{data?.stats.workers ?? "—"}</b>
                {bn ? "কাজের মানুষ" : "workers"}
              </div>
              <div>
                <b>{data?.stats.jobs ?? "—"}</b>
                {bn ? "খোলা কাজ" : "open jobs"}
              </div>
              <div>
                <b>{data?.stats.completed ?? "—"}</b>
                {bn ? "সম্পন্ন" : "completed"}
              </div>
            </div>
          </div>
          <div className="km-hero-card">
            {(data?.featuredWorkers || []).slice(0, 3).map((w) => (
              <article key={w.id}>
                <KmAvatar name={w.name} />
                <div>
                  <strong>{w.name}</strong> <KmVerified on={w.verified} />
                  <p className="km-meta">
                    {w.area}, {w.district}
                  </p>
                  <KmStars value={w.rating} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="km-section km-wrap">
        <h2>{bn ? "কী কাজ লাগবে?" : "What do you need?"}</h2>
        <p className="km-muted">
          {bn ? "ক্যাটাগরি বেছে নিন — কাছের ভেরিফায়েড মানুষ দেখুন।" : "Pick a category and see trusted people nearby."}
        </p>
        <div className="km-cats">
          {(data?.categories || []).map((c) => (
            <Link key={c.id} className="km-cat" href={`${KAJMAMA_BASE}/workers?category=${c.id}`}>
              <span className="ico">{c.icon}</span>
              <b>{bn ? c.nameBn : c.nameEn}</b>
              <span>{bn ? c.blurbBn : c.blurbEn}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="km-section km-wrap">
        <div className="km-page-head">
          <div>
            <h2>{bn ? "নির্বাচিত মামা" : "Featured people"}</h2>
            <p className="km-muted">{bn ? "রেটিং ও ভেরিফিকেশন অনুসারে।" : "Sorted by verification and rating."}</p>
          </div>
          <Link className="km-btn ghost sm" href={`${KAJMAMA_BASE}/workers`}>
            {bn ? "সব দেখুন" : "See all"}
          </Link>
        </div>
        <div className="km-grid-3">
          {(data?.featuredWorkers || []).map((w) => (
            <Link key={w.id} href={`${KAJMAMA_BASE}/workers/${w.id}`} className="km-card km-worker">
              <div className="km-worker-top">
                <KmAvatar name={w.name} size={52} />
                <div>
                  <h3>{w.name}</h3>
                  <p className="km-meta">
                    {w.area}, {w.district} · {w.experienceYears}
                    {bn ? " বছর" : " yrs"}
                  </p>
                  <KmVerified on={w.verified} />
                </div>
              </div>
              <div className="km-chips">
                {w.skills.map((s) => (
                  <KmSkill key={s} id={s} />
                ))}
              </div>
              <div className="km-worker-foot">
                <KmStars value={w.rating} />
                <KmMoney amount={w.jobRate || w.hourlyRate} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="km-section km-wrap" id="how">
        <h2>{t.how}</h2>
        <p className="km-muted">{t.trust}</p>
        <div className="km-steps">
          <article className="km-step">
            <i>১</i>
            <h3>{bn ? "কাজ বলুন" : "Say the work"}</h3>
            <p className="km-muted">{bn ? "কী লাগবে, কোথায়, কখন — তিন লাইনে।" : "What, where, when — in three lines."}</p>
          </article>
          <article className="km-step">
            <i>২</i>
            <h3>{bn ? "মানুষ বেছে নিন" : "Choose someone"}</h3>
            <p className="km-muted">
              {bn ? "রেটিং, এলাকা, ভেরিফায়েড ব্যাজ দেখে হায়ার করুন।" : "Hire by rating, area, and verified badge."}
            </p>
          </article>
          <article className="km-step">
            <i>৩</i>
            <h3>{bn ? "কাজ শেষ, রিভিউ" : "Finish & review"}</h3>
            <p className="km-muted">
              {bn ? "চ্যাট করে কাজ শেষ করুন। দুই পক্ষই রেটিং দেবে।" : "Chat, complete, and both sides review."}
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
