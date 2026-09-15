"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KAJMAMA_BASE } from "@/lib/kajmama/constants";
import { kmApi } from "@/lib/kajmama/client";
import { timeAgo } from "@/lib/kajmama/format";
import type { PublicUser } from "@/lib/kajmama/types";
import { useKm } from "./KmSession";
import { KmAdSlot } from "./KmAds";
import { KmAvatar, KmMoney, KmSkill, KmStars, KmVerified } from "./KmUi";

type Review = { id: string; rating: number; text: string; createdAt: string; fromName: string };

export function KmWorkerProfile() {
  const { id } = useParams<{ id: string }>();
  const { lang, user, meta } = useKm();
  const bn = lang === "bn";
  const router = useRouter();
  const [tab, setTab] = useState<"about" | "reviews">("about");
  const [worker, setWorker] = useState<PublicUser | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<PublicUser[]>([]);
  const [canHire, setCanHire] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    kmApi<{ worker: PublicUser; reviews: Review[]; similar?: PublicUser[]; canHire: boolean }>(
      `/api/kajmama/workers/${id}`,
    )
      .then((d) => {
        setWorker(d.worker);
        setReviews(d.reviews);
        setSimilar(d.similar || []);
        setCanHire(d.canHire);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "লোড হয়নি"));
  }, [id]);

  if (error) {
    return (
      <div className="km-page km-wrap">
        <p className="km-error">{error}</p>
      </div>
    );
  }
  if (!worker) {
    return (
      <div className="km-page km-wrap">
        <p className="km-muted">{bn ? "লোড হচ্ছে…" : "Loading…"}</p>
      </div>
    );
  }

  const skill = meta.categories.find((c) => c.id === (worker.skills[0] || ""));
  const phone = worker.phone || worker.phoneMasked;
  const hireHref = `${KAJMAMA_BASE}/jobs/new?worker=${worker.id}&category=${worker.skills[0] || ""}`;

  return (
    <div className="km-page km-wrap">
      <p className="km-crumb">
        <Link href={KAJMAMA_BASE}>{bn ? "হোম" : "Home"}</Link> · {bn ? "কর্মীর প্রোফাইল" : "Worker profile"}
      </p>
      <div className="km-profile-hero">
        <div className="km-avatar-wrap">
          <KmAvatar name={worker.name} id={worker.id} size={108} />
          {worker.premium ? <span className="km-photo-badge">PREMIUM</span> : null}
        </div>
        <div className="km-profile-hero-main">
          <h1>
            {worker.name} <KmVerified on={worker.verified} />
          </h1>
          <p className="km-jobpill">{skill ? (bn ? skill.nameBn : skill.nameEn) : ""}</p>
          <p className="km-meta">
            📍 {worker.upazila || worker.area}, {worker.district}
          </p>
          <p className="km-meta">
            <KmStars value={worker.rating || 4.8} /> {(worker.rating || 4.8).toFixed(1)} · {worker.reviewCount || 0}{" "}
            {bn ? "রিভিউ" : "reviews"}
          </p>
          {worker.premium ? (
            <span className="km-verified-box">{bn ? "PREMIUM সদস্য" : "PREMIUM member"}</span>
          ) : null}
        </div>
        <div className="km-profile-actions">
          {worker.phone ? (
            <a className="km-btn gold" href={`tel:${worker.phone}`}>
              📞 {phone}
            </a>
          ) : (
            <Link className="km-btn gold" href={user ? hireHref : `${KAJMAMA_BASE}/login`}>
              📞 {phone}
            </Link>
          )}
          {worker.phone ? (
            <a className="km-btn light" href={`https://wa.me/88${worker.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          ) : (
            <Link className="km-btn light" href={canHire ? hireHref : `${KAJMAMA_BASE}/login`}>
              WhatsApp
            </Link>
          )}
          {canHire ? (
            <Link className="km-btn ghost sm" href={hireHref}>
              {bn ? "হায়ার করুন" : "Hire"}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="km-profile">
        <div>
          <div className="km-tabs">
            <button type="button" className={tab === "about" ? "on" : ""} onClick={() => setTab("about")}>
              {bn ? "সম্পর্কে" : "About"}
            </button>
            <button type="button" className={tab === "reviews" ? "on" : ""} onClick={() => setTab("reviews")}>
              {bn ? `রিভিউ (${reviews.length})` : `Reviews (${reviews.length})`}
            </button>
          </div>
          {tab === "about" ? (
            <article className="km-card">
              <h3>{bn ? "আমার সম্পর্কে" : "About me"}</h3>
              <p style={{ lineHeight: 1.7 }}>{worker.bio}</p>
              <h3 style={{ marginTop: "1.2rem" }}>{bn ? "দক্ষতা সমূহ" : "Skills"}</h3>
              <div className="km-chips">
                {worker.skills.map((s) => (
                  <KmSkill key={s} id={s} />
                ))}
              </div>
              <div className="km-infogrid">
                <div>
                  <span className="km-muted">{bn ? "অভিজ্ঞতা" : "Experience"}</span>
                  <b>
                    {worker.experienceYears} {bn ? "বছর" : "years"}
                  </b>
                </div>
                <div>
                  <span className="km-muted">{bn ? "কর্ম এলাকা" : "Work area"}</span>
                  <b>
                    {worker.area}, {worker.district}
                  </b>
                </div>
                <div>
                  <span className="km-muted">{bn ? "রেট" : "Rate"}</span>
                  <b>
                    <KmMoney amount={worker.jobRate} />
                  </b>
                </div>
              </div>
            </article>
          ) : (
            <article className="km-card">
              {reviews.length === 0 ? (
                <p className="km-muted">{bn ? "এখনো রিভিউ নেই।" : "No reviews yet."}</p>
              ) : (
                <div className="km-list">
                  {reviews.map((r) => (
                    <div key={r.id} className="km-card" style={{ padding: "0.8rem" }}>
                      <KmStars value={r.rating} />
                      <p style={{ margin: "0.35rem 0 0" }}>{r.text}</p>
                      <p className="km-meta">
                        {r.fromName} · {timeAgo(r.createdAt, bn)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          )}
        </div>
        <aside>
          <KmAdSlot placement="profile_sidebar" />
          <div className="km-card">
            <div className="km-page-head" style={{ marginBottom: "0.7rem" }}>
              <h3 style={{ margin: 0 }}>{bn ? "অনুরূপ কর্মী" : "Similar workers"}</h3>
              <Link className="km-seeall" href={`${KAJMAMA_BASE}/workers?category=${worker.skills[0] || ""}`}>
                {bn ? "সকল দেখুন" : "See all"}
              </Link>
            </div>
            {similar.length === 0 ? <p className="km-muted">{bn ? "এখন কেউ নেই।" : "None yet."}</p> : null}
            {similar.map((w) => (
              <Link key={w.id} href={`${KAJMAMA_BASE}/workers/${w.id}`} className="km-similar">
                <KmAvatar name={w.name} id={w.id} size={44} />
                <span>
                  <b>{w.name}</b>
                  <em>
                    {w.area} · <KmStars value={w.rating || 4.5} />
                  </em>
                </span>
              </Link>
            ))}
          </div>
          <div className="km-card" style={{ marginTop: "0.8rem" }}>
            <h3>{bn ? "বিশ্বাস ও নিরাপত্তা" : "Trust & safety"}</h3>
            {worker.verified ? (
              <p className="km-meta">✓ {bn ? "অ্যাডমিন ভেরিফায়েড প্রোফাইল" : "Admin-verified profile"}</p>
            ) : null}
            {worker.premium ? (
              <p className="km-meta">👑 {bn ? "প্রিমিয়াম সদস্য" : "Premium member"}</p>
            ) : null}
            <p className="km-muted" style={{ marginTop: "0.6rem" }}>
              {bn
                ? "বুকিং কনফার্মের আগে পুরো নম্বর দেখাবে না।"
                : "Full phone stays hidden until a booking is accepted."}
            </p>
            {canHire ? (
              <Link className="km-btn gold" href={hireHref} style={{ marginTop: "0.8rem", width: "100%" }}>
                {bn ? "এই কর্মীকে হায়ার করুন" : "Hire this worker"}
              </Link>
            ) : user ? (
              <p className="km-muted">{bn ? "নিজের প্রোফাইল।" : "This is your profile."}</p>
            ) : (
              <button type="button" className="km-btn gold" onClick={() => router.push(`${KAJMAMA_BASE}/login`)}>
                {bn ? "লগইন করে হায়ার" : "Log in to hire"}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
