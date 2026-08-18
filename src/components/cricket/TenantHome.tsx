"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { formatOvers, formatScore, formatScheduleWhen, statusLabel } from "@/lib/cricket/format";
import { TournamentSetup } from "./TournamentSetup";
import "./cricket.css";

type MatchRow = {
  id: string;
  title: string;
  format: string;
  status: "upcoming" | "live" | "completed";
  venue: string;
  teamA: { name: string; short: string };
  teamB: { name: string; short: string };
  scheduledAt?: string;
  result?: { summaryBn: string; winnerName: string; loserName: string; winnerSide: string };
  innings: { battingTeam: "a" | "b"; runs: number; wickets: number; legalBalls: number }[];
  currentInningsIndex: number;
};

type TenantInfo = {
  slug: string;
  name: string;
  brandColor: string;
  contactPhone: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
};

export function TenantHome({ slug }: { slug: string }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pending, startTransition] = useTransition();
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
    const qp = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("pin") : null;
    const initialPin = qp || saved || "";
    if (initialPin) {
      setPin(initialPin);
      if (qp) sessionStorage.setItem(`pl-pin-${slug}`, qp);
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
      setTenant(data.tenant);
      setMatches(data.matches);
      setMsg("লগইন OK — এখন টুর্নামেন্ট সেটআপ করুন");
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
        {tenant?.description ? <p className="pl-tenant-desc">{tenant.description}</p> : null}
        {tenant?.venue || tenant?.startDate ? (
          <p className="pl-muted">
            {tenant.venue ? `ভেন্যু: ${tenant.venue}` : ""}
            {tenant.startDate ? ` · ${tenant.startDate}${tenant.endDate ? ` – ${tenant.endDate}` : ""}` : ""}
          </p>
        ) : null}
        <p className="pl-muted">লাইভ ম্যাচ দেখুন অথবা স্কোরার হিসেবে আপডেট করুন</p>
        <p className="no-print">
          <Link href={`/cricket/t/${slug}/stats`}>টুর্নামেন্ট stats / রিপোর্ট →</Link>
        </p>

        <section className="pl-card-block" style={{ marginTop: "1rem" }}>
          <h2>স্কোরার লগইন</h2>
          <p className="pl-muted">ডেমো পিন: 1234 — লগইন করলে টুর্নামেন্ট details ও fixtures এডিট করতে পারবেন</p>
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
          {msg ? <p className="pl-muted">{msg}</p> : null}
        </section>

        {authed ? (
          <TournamentSetup
            slug={slug}
            pin={pin}
            tenant={tenant}
            matches={matches}
            onUpdated={load}
            onMsg={setMsg}
          />
        ) : null}

        <div className="pl-match-list">
          <h2>ম্যাচ তালিকা</h2>
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
                  {m.scheduledAt ? ` · ${formatScheduleWhen(m.scheduledAt)}` : ""}
                </p>
                {m.status === "completed" && m.result?.summaryBn ? (
                  <p className="pl-match-result-line">{m.result.summaryBn}</p>
                ) : null}
                <div className="pl-actions-row wrap">
                  <Link className="pl-btn primary" href={`/cricket/t/${slug}/m/${m.id}`}>
                    লাইভ দেখুন
                  </Link>
                  {authed ? (
                    <Link className="pl-btn" href={`/cricket/t/${slug}/m/${m.id}/score`}>
                      স্কোর আপডেট
                    </Link>
                  ) : null}
                  {m.status === "upcoming" && authed ? (
                    <Link className="pl-btn ghost" href={`/cricket/t/${slug}/m/${m.id}/team`}>
                      টিম লিস্ট
                    </Link>
                  ) : null}
                  {m.status === "completed" ? (
                    <Link className="pl-btn ghost" href={`/cricket/t/${slug}/m/${m.id}/report`}>
                      ম্যাচ সারাংশ
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
          {matches.length === 0 ? <p className="pl-muted">এখনো কোনো ম্যাচ নেই — লগইন করে fixture যোগ করুন</p> : null}
        </div>
      </div>
    </div>
  );
}
