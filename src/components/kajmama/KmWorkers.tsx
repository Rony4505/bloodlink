"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CATEGORIES, DISTRICTS, KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { kmApi } from "@/lib/kajmama/client";
import type { PublicUser } from "@/lib/kajmama/types";
import { useKm } from "./KmSession";
import { KmAvatar, KmEmpty, KmMoney, KmSkill, KmStars, KmVerified } from "./KmUi";

export function KmWorkers() {
  const { lang } = useKm();
  const bn = lang === "bn";
  const params = useSearchParams();
  const [category, setCategory] = useState(params.get("category") || "");
  const [district, setDistrict] = useState(params.get("district") || "");
  const [q, setQ] = useState(params.get("q") || "");
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

  return (
    <div className="km-page km-wrap">
      <div className="km-page-head">
        <div>
          <h1>{bn ? "কাজের মানুষ" : "Workers"}</h1>
          <p className="km-muted">{bn ? "এলাকা ও স্কিল দিয়ে খুঁজুন।" : "Search by area and skill."}</p>
        </div>
      </div>
      <div className="km-filters">
        <input
          className="km-input"
          style={{ maxWidth: 240 }}
          placeholder={bn ? "নাম বা এলাকা" : "Name or area"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="km-select" style={{ maxWidth: 200 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{bn ? "সব ক্যাটাগরি" : "All categories"}</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {bn ? c.nameBn : c.nameEn}
            </option>
          ))}
        </select>
        <select className="km-select" style={{ maxWidth: 180 }} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">{bn ? "সব জেলা" : "All districts"}</option>
          {DISTRICTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      {workers === null ? <p className="km-muted">{bn ? "খুঁজছি…" : "Searching…"}</p> : null}
      {workers && workers.length === 0 ? (
        <KmEmpty
          title={bn ? "এখন কেউ নেই" : "No one yet"}
          hint={bn ? "ফিল্টার বদলান, অথবা নিজে প্রোফাইল খুলুন।" : "Change filters, or open a profile."}
          href={`${KAJMAMA_BASE}/register`}
          cta={bn ? "প্রোফাইল খুলুন" : "Sign up"}
        />
      ) : null}
      {workers && workers.length > 0 ? (
        <div className="km-grid-3">
          {workers.map((w) => (
            <Link key={w.id} href={`${KAJMAMA_BASE}/workers/${w.id}`} className="km-card km-worker">
              <div className="km-worker-top">
                <KmAvatar name={w.name} size={50} />
                <div>
                  <h3>{w.name}</h3>
                  <p className="km-meta">
                    {w.area}, {w.district}
                  </p>
                  <KmVerified on={w.verified} />
                </div>
              </div>
              <p className="km-meta">{w.bio}</p>
              <div className="km-chips">
                {w.skills.map((s) => (
                  <KmSkill key={s} id={s} />
                ))}
              </div>
              <div className="km-worker-foot">
                <span>
                  <KmStars value={w.rating} /> {w.reviewCount ? `(${w.reviewCount})` : ""}
                </span>
                <KmMoney amount={w.jobRate || w.hourlyRate} />
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
