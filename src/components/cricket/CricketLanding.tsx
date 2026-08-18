"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./cricket.css";

type PublicInfo = {
  settings: { siteName: string; tagline: string; contactPhone: string };
  demoSlug: string;
  tenantsPublic: { slug: string; name: string; brandColor: string; plan: string }[];
};

const FEATURES = [
  {
    kicker: "Broadcast",
    title: "TV-grade live overlay",
    body: "স্ট্রিমের নিচে score line, ভিতরে batting XI, bowling, partnership, player vs teams আর next match — international match এর মতো।",
  },
  {
    kicker: "Scoring",
    title: "One-tap ball by ball",
    body: "0–6, W, WD, NB, Bye, LB. No-ball এ অটো FREE HIT। Undo, wicket popup, ওভার শেষে next bowler।",
  },
  {
    kicker: "Club ops",
    title: "Team list to print report",
    body: "১১ জন + রোল, blank print sheet, ম্যাচ রিপোর্ট, player-wise ও team-wise tournament stats।",
  },
  {
    kicker: "Rental",
    title: "Your club. Your link.",
    body: "প্রতি ক্লাবের আলাদা পাবলিক URL, পিন-প্রোটেক্টেড স্কোরার, মেয়াদ ও প্ল্যান কন্ট্রোল।",
  },
];

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
  const liveHref = `/cricket/t/${demoSlug}/m/match_demo_live`;
  const clubHref = `/cricket/t/${demoSlug}`;
  const phone = info?.settings.contactPhone || "";
  const clubs = info?.tenantsPublic?.length
    ? info.tenantsPublic
    : [{ slug: "demo", name: "ডেমো ক্লাব ক্রিকেট", brandColor: "#0B6E4F", plan: "monthly" }];

  return (
    <div className="pl-shell pl-landing">
      <div className="pl-landing-glow" aria-hidden />

      <header className="pl-landing-nav">
        <div className="pl-wrap pl-landing-nav-inner">
          <Link href="/cricket" className="pl-logo">
            <span className="pl-logo-mark" aria-hidden />
            <span>{name}</span>
          </Link>
          <nav>
            <Link href={clubHref}>Log in</Link>
            <Link href={liveHref}>Demo</Link>
            <Link href="/cricket/admin">Rent</Link>
            <a href="#features">Fiture</a>
          </nav>
        </div>
      </header>

      <section className="pl-hero pl-landing-hero">
        <div className="pl-wrap pl-landing-hero-grid">
          <div className="pl-hero-copy">
            <p className="pl-kicker">
              <i className="pl-live-dot" /> Live broadcast platform
            </p>
            <h1>
              Club cricket,
              <em> cinema-grade</em>
              <span> live score.</span>
            </h1>
            <p className="pl-hero-lead">
              {info?.settings.tagline ||
                "স্ট্রিম, স্কোর, গ্রাফিক্স আর রিপোর্ট — টুর্নামেন্ট চলাকালীন এক প্ল্যাটফর্মে।"}
            </p>
            <div className="pl-cta">
              <Link className="pl-btn pl-btn-gold" href={liveHref}>
                Live demo দেখুন
              </Link>
              <Link className="pl-btn light" href="/cricket/admin">
                Rent PitchLive
              </Link>
            </div>
            <p className="pl-hero-meta">ডেমো ক্লাব পিন <b>1234</b> · ওনার <b>4505</b></p>
            <ul className="pl-hero-stats">
              <li>
                <strong>TV overlay</strong>
                <span>Free hit, XI, next match</span>
              </li>
              <li>
                <strong>Print ready</strong>
                <span>Team sheet + reports</span>
              </li>
              <li>
                <strong>Per club</strong>
                <span>Private scorer link</span>
              </li>
            </ul>
          </div>

          <aside className="pl-hero-device">
            <div className="pl-device">
              <div className="pl-device-bar">
                <span className="pl-live-pill">● LIVE</span>
                <span>Friendship Cup · Final</span>
              </div>
              <iframe src={liveHref} title="PitchLive live broadcast preview" />
            </div>
            <p className="pl-device-caption">Real product preview — edit করলে এখানেই দেখাবে</p>
          </aside>
        </div>
      </section>

      <section className="pl-section pl-wrap" id="features">
        <div className="pl-section-head">
          <p className="pl-kicker dark">Fiture</p>
          <h2>Broadcast desk in your pocket</h2>
          <p className="pl-muted">স্কোরার এক হাতে আপডেট করে, দর্শক স্ট্রিমে international-style graphics দেখে।</p>
        </div>
        <div className="pl-feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="pl-feature-card">
              <p className="pl-kicker dark">{f.kicker}</p>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pl-section pl-wrap" id="preview">
        <div className="pl-section-head">
          <p className="pl-kicker dark">Design preview</p>
          <h2>কেমন দেখাবে</h2>
          <p className="pl-muted">লাইভ ওয়েবসাইটেরই ফ্রেম — mockup নয়।</p>
        </div>
        <div className="pl-live-preview-grid">
          <div className="pl-preview-card">
            <div className="pl-preview-label">
              <h3>Club home</h3>
              <Link href={clubHref}>Open →</Link>
            </div>
            <iframe src={clubHref} title="PitchLive club preview" />
          </div>
          <div className="pl-preview-card">
            <div className="pl-preview-label">
              <h3>Live match</h3>
              <Link href={liveHref}>Open →</Link>
            </div>
            <iframe src={liveHref} title="PitchLive live preview" />
          </div>
        </div>
      </section>

      <section className="pl-section pl-wrap" id="clubs">
        <div className="pl-section-head">
          <p className="pl-kicker dark">On air</p>
          <h2>চালু ক্লাব</h2>
        </div>
        <div className="pl-club-grid">
          {clubs.map((t) => (
            <Link key={t.slug} href={`/cricket/t/${t.slug}`} className="pl-club-card">
              <i style={{ background: t.brandColor || "#0B6E4F" }} />
              <strong>{t.name}</strong>
              <span>/{t.slug}</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="pl-landing-footer">
        <div className="pl-wrap pl-landing-footer-inner">
          <div>
            <p className="pl-logo">
              <span className="pl-logo-mark" aria-hidden />
              <span>{name}</span>
            </p>
            <p>ক্লাব ও টুর্নামেন্টের জন্য premium live score rental.</p>
          </div>
          <div className="pl-footer-cta">
            <Link className="pl-btn pl-btn-gold" href="/cricket/admin">Rent</Link>
            <Link className="pl-btn light" href={liveHref}>Demo</Link>
            {phone ? <a className="pl-footer-phone" href={`tel:${phone}`}>{phone}</a> : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
