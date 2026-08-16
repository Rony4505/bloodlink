"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./cricket.css";

type PublicInfo = {
  settings: { siteName: string; tagline: string; contactPhone: string };
  demoSlug: string;
  tenantsPublic: { slug: string; name: string; brandColor: string; plan: string }[];
};

export function CricketLanding() {
  const [info, setInfo] = useState<PublicInfo | null>(null);

  useEffect(() => {
    fetch("/api/cricket")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  const name = info?.settings.siteName || "PitchLive";

  return (
    <div className="pl-shell">
      <section className="pl-hero">
        <div className="pl-wrap pl-hero-inner">
          <p className="pl-brand">{name}</p>
          <h2>ম্যাচ চলাকালীন লাইভ স্কোর আপডেট — ভিডিওসহ রেন্ট করুন</h2>
          <p>
            {info?.settings.tagline ||
              "ক্লাব/টুর্নামেন্ট আয়োজকদের জন্য সহজ স্কোরার কনসোল + দর্শক পেজ।"}
          </p>
          <div className="pl-cta">
            <Link className="pl-btn primary" href={`/cricket/t/${info?.demoSlug || "demo"}`}>
              ডেমো দেখুন
            </Link>
            <Link className="pl-btn light" href="/cricket/admin">
              রেন্ট অ্যাডমিন
            </Link>
            <a className="pl-btn light" href="#features">
              ফিচার
            </a>
          </div>
        </div>
      </section>

      <section className="pl-section pl-wrap" id="features">
        <h2>সহজ ব্যবহার, পূর্ণ ফিচার</h2>
        <p className="pl-muted">এক হাতে স্কোর আপডেট, অন্যদিকে দর্শকরা লাইভ দেখবে।</p>
        <ul className="pl-feature-list">
          <li>বল-বাই-বল স্কোর (0–6, W, WD, NB, Bye, LB) + Undo</li>
          <li>লাইভ ভিডিও (YouTube/Facebook) + স্কোর একসাথে</li>
          <li>স্কোরকার্ড, কমেন্টারি, ২য় ইনিংস/টার্গেট</li>
          <li>ক্লাবভেদে আলাদা লিংক — রেন্ট প্ল্যান (দৈনিক/সাপ্তাহিক/মাসিক/ইভেন্ট)</li>
          <li>মোবাইল-ফ্রেন্ডলি স্কোরার কনসোল</li>
        </ul>
      </section>

      <section className="pl-section pl-wrap">
        <h2>কেমন দেখাবে</h2>
        <p className="pl-muted">ডিজাইন প্রিভিউ — আসল সাইটও এই ফ্লোতে কাজ করে।</p>
        <div className="pl-mock-grid">
          <figure>
            <img src="/cricket-mockups/mockup_pitchlive_landing.png" alt="PitchLive ল্যান্ডিং" />
            <figcaption>ল্যান্ডিং / রেন্ট পেজ</figcaption>
          </figure>
          <figure>
            <img src="/cricket-mockups/mockup_live_score_video.png" alt="লাইভ স্কোর + ভিডিও" />
            <figcaption>দর্শক: ভিডিও + লাইভ স্কোর</figcaption>
          </figure>
          <figure>
            <img src="/cricket-mockups/mockup_scorer_console.png" alt="স্কোরার কনসোল" />
            <figcaption>স্কোরার কনসোল</figcaption>
          </figure>
        </div>
      </section>

      <section className="pl-section pl-wrap">
        <h2>চালু ক্লাব</h2>
        <div className="pl-match-list">
          {(info?.tenantsPublic || [{ slug: "demo", name: "ডেমো ক্লাব ক্রিকেট" }]).map((t) => (
            <Link key={t.slug} href={`/cricket/t/${t.slug}`}>
              <strong>{t.name}</strong>
              <div className="pl-muted">/{t.slug}</div>
            </Link>
          ))}
        </div>
        <p className="pl-muted" style={{ marginTop: "1.2rem" }}>
          যোগাযোগ: {info?.settings.contactPhone || "01XXXXXXXXX"}
        </p>
      </section>
    </div>
  );
}
