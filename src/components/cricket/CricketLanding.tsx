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
  const demoSlug = info?.demoSlug || "demo";

  return (
    <div className="pl-shell">
      <section className="pl-hero">
        <div className="pl-wrap pl-hero-inner">
          <header className="pl-hero-nav">
            <p className="pl-brand">{name}</p>
            <nav>
              <Link href={`/cricket/t/${demoSlug}`}>Log in</Link>
              <Link href={`/cricket/t/${demoSlug}/m/match_demo_live`}>Demo</Link>
              <Link href="/cricket/admin">Rent</Link>
              <a href="#features">Fiture</a>
            </nav>
          </header>

          <div className="pl-hero-copy">
            <h2>Club cricket stream + scoreboard in one place</h2>
            <p>{info?.settings.tagline || "সহজ স্কোরার, লাইভ স্ট্রিম, টিম লিস্ট, পারফরম্যান্স গ্রাফিক্স।"}</p>
            <div className="pl-cta">
              <Link className="pl-btn primary" href={`/cricket/t/${demoSlug}/m/match_demo_live`}>
                Demo
              </Link>
              <Link className="pl-btn light" href="/cricket/admin">
                Rent
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pl-section pl-wrap" id="features">
        <h2>সহজ ব্যবহার, পূর্ণ ফিচার</h2>
        <p className="pl-muted">লাইভ ম্যাচ, auto team list, player performance, print report.</p>
        <ul className="pl-feature-list">
          <li>বল-বাই-বল স্কোর + Undo + wicket popup</li>
          <li>স্ট্রিমের মধ্যে player / batting / bowling performance graphic</li>
          <li>টিম লিস্ট, রোল, blank print sheet, match report print</li>
          <li>টুর্নামেন্টজুড়ে player performance save</li>
        </ul>
      </section>

      <section className="pl-section pl-wrap">
        <h2>কেমন দেখাবে</h2>
        <p className="pl-muted">এখানে live preview আছে — website edit করলে এটাও বদলাবে।</p>
        <div className="pl-live-preview-grid">
          <div className="pl-preview-card">
            <h3>Club home</h3>
            <iframe src={`/cricket/t/${demoSlug}`} title="PitchLive club preview" />
          </div>
          <div className="pl-preview-card">
            <h3>Live Match</h3>
            <iframe src={`/cricket/t/${demoSlug}/m/match_demo_live`} title="PitchLive live preview" />
          </div>
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
      </section>
    </div>
  );
}
