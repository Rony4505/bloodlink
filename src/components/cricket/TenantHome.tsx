"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { formatOvers, formatScore, statusLabel } from "@/lib/cricket/format";
import "./cricket.css";

type MatchRow = {
  id: string;
  title: string;
  format: string;
  status: "upcoming" | "live" | "completed";
  venue: string;
  teamA: { name: string; short: string };
  teamB: { name: string; short: string };
  innings: { battingTeam: "a" | "b"; runs: number; wickets: number; legalBalls: number }[];
  currentInningsIndex: number;
};

type TenantInfo = {
  slug: string;
  name: string;
  brandColor: string;
};

export function TenantHome({ slug }: { slug: string }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pending, startTransition] = useTransition();

  // create match form
  const [title, setTitle] = useState("");
  const [teamA, setTeamA] = useState("মিরপুর একাদশ");
  const [teamB, setTeamB] = useState("ধানমন্ডি XI");
  const [venue, setVenue] = useState("");
  const [format, setFormat] = useState("T20");
  const [msg, setMsg] = useState("");

  function load() {
    fetch(`/api/cricket/tenants?slug=${encodeURIComponent(slug)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "লোড ব্যর্থ");
        setTenant(data.tenant);
        setMatches(data.matches);
        setError("");
      })
      .catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    load();
    const saved = sessionStorage.getItem(`pl-pin-${slug}`);
    if (saved) {
      setPin(saved);
      setAuthed(true);
    }
  }, [slug]);

  function login() {
    startTransition(async () => {
      const res = await fetch("/api/cricket/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tenant_login", slug, tenantPin: pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "লগইন ব্যর্থ");
        return;
      }
      sessionStorage.setItem(`pl-pin-${slug}`, pin);
      setAuthed(true);
      setMatches(data.matches);
      setMsg("লগইন OK");
    });
  }

  function createMatch() {
    startTransition(async () => {
      const res = await fetch("/api/cricket/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_match",
          slug,
          tenantPin: pin,
          title: title || `${teamA} vs ${teamB}`,
          teamAName: teamA,
          teamBName: teamB,
          venue,
          format,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "ম্যাচ তৈরি ব্যর্থ");
        return;
      }
      setMsg("ম্যাচ তৈরি হয়েছে");
      load();
    });
  }

  return (
    <div className="pl-shell">
      <div className="pl-tenant">
        <header className="pl-topbar">
          <Link href="/cricket">← PitchLive</Link>
          <span style={{ color: tenant?.brandColor || "#0B6E4F" }}>{tenant?.name || slug}</span>
        </header>

        {error ? <p className="pl-error">{error}</p> : null}

        <h1 style={{ margin: "0.4rem 0" }}>{tenant?.name || "ক্লাব"}</h1>
        <p className="pl-muted">লাইভ ম্যাচ দেখুন অথবা স্কোরার হিসেবে আপডেট করুন</p>

        <div className="pl-match-list">
          {matches.map((m) => {
            const inn = m.innings[m.currentInningsIndex];
            return (
              <div key={m.id} className="pl-card-block">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                  <strong>
                    {m.teamA.name} vs {m.teamB.name}
                  </strong>
                  <span className={`pl-status pl-status-${m.status}`}>{statusLabel(m.status)}</span>
                </div>
                <p className="pl-muted" style={{ margin: "0.35rem 0" }}>
                  {m.title} · {m.format}
                  {inn ? ` · ${formatScore(inn)} (${formatOvers(inn)})` : ""}
                </p>
                <div className="pl-actions-row wrap">
                  <Link className="pl-btn primary" href={`/cricket/t/${slug}/m/${m.id}`}>
                    লাইভ দেখুন
                  </Link>
                  {authed ? (
                    <Link className="pl-btn" href={`/cricket/t/${slug}/m/${m.id}/score`}>
                      স্কোর আপডেট
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
          {matches.length === 0 ? <p className="pl-muted">এখনো কোনো ম্যাচ নেই</p> : null}
        </div>

        <section className="pl-card-block" style={{ marginTop: "1.2rem" }}>
          <h2>স্কোরার লগইন</h2>
          <p className="pl-muted">ডেমো পিন: 1234</p>
          <div className="pl-form">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="ক্লাব পিন"
            />
            <button type="button" className="pl-btn primary" disabled={pending} onClick={login}>
              লগইন
            </button>
          </div>

          {authed ? (
            <>
              <h3 style={{ marginTop: "1.2rem" }}>নতুন ম্যাচ</h3>
              <div className="pl-form">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ম্যাচ টাইটেল" />
                <input value={teamA} onChange={(e) => setTeamA(e.target.value)} placeholder="টিম A" />
                <input value={teamB} onChange={(e) => setTeamB(e.target.value)} placeholder="টিম B" />
                <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="ভেন্যু" />
                <select value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="T20">T20</option>
                  <option value="ODI">ODI</option>
                  <option value="Test">Test</option>
                  <option value="Custom">Custom</option>
                </select>
                <button type="button" className="pl-btn primary" disabled={pending} onClick={createMatch}>
                  ম্যাচ তৈরি
                </button>
              </div>
            </>
          ) : null}
          {msg ? <p className="pl-muted">{msg}</p> : null}
        </section>
      </div>
    </div>
  );
}
