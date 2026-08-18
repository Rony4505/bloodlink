"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Match } from "@/lib/cricket/types";
import { ScorerConsole } from "./ScorerConsole";
import "./cricket.css";

export function ScorerPageClient({ slug, matchId }: { slug: string; matchId: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [accent, setAccent] = useState("#0B6E4F");
  const [pin, setPin] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const qPin = new URLSearchParams(window.location.search).get("pin") || "";
    const saved = qPin || sessionStorage.getItem(`pl-pin-${slug}`) || "";
    if (qPin) sessionStorage.setItem(`pl-pin-${slug}`, qPin);
    setPin(saved);
    fetch(`/api/cricket/matches/${matchId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "লোড ব্যর্থ");
        setMatch(data.match);
        setAccent(data.tenant.brandColor || "#0B6E4F");
        if (saved) setReady(true);
      })
      .catch((e: Error) => setError(e.message));
  }, [matchId, slug]);

  if (error) {
    return (
      <div className="pl-shell">
        <div className="pl-scorer">
          <p className="pl-error">{error}</p>
          <Link href={`/cricket/t/${slug}`}>ফিরে যান</Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="pl-shell">
        <div className="pl-scorer">
          <p className="pl-muted">লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="pl-shell">
        <div className="pl-scorer">
          <header className="pl-topbar">
            <Link href={`/cricket/t/${slug}`}>← ক্লাব</Link>
            <span>স্কোরার লক</span>
          </header>
          <div className="pl-card-block">
            <h2>পিন দিন</h2>
            <div className="pl-form">
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="ক্লাব পিন" />
              <button
                type="button"
                className="pl-btn primary"
                onClick={() => {
                  sessionStorage.setItem(`pl-pin-${slug}`, pin);
                  setReady(true);
                }}
              >
                কনসোল খুলুন
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-shell">
      <div className="pl-scorer">
        <header className="pl-topbar">
          <Link href={`/cricket/t/${slug}/m/${matchId}`}>দর্শক ভিউ</Link>
          <Link href={`/cricket/t/${slug}`}>ক্লাব</Link>
        </header>
        <ScorerConsole matchId={matchId} tenantPin={pin} accent={accent} initialMatch={match} slug={slug} />
      </div>
    </div>
  );
}
