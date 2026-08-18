"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Scorecard } from "./Scorecard";
import type { Match, PlayerRecord } from "@/lib/cricket/types";
import "./cricket.css";

export function MatchReportPage({ slug, matchId }: { slug: string; matchId: string }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [records, setRecords] = useState<PlayerRecord[]>([]);

  useEffect(() => {
    fetch(`/api/cricket/matches/${matchId}`)
      .then((r) => r.json())
      .then((d) => {
        setMatch(d.match);
        setRecords(d.playerRecords || []);
      });
  }, [matchId]);

  return (
    <div className="pl-shell">
      <div className="pl-team-sheet">
        <header className="pl-topbar no-print">
          <Link href={`/cricket/t/${slug}/m/${matchId}`}>← লাইভ</Link>
          <span>ম্যাচ রিপোর্ট</span>
        </header>
        {match ? (
          <>
            <div className="pl-sheet-toolbar no-print">
              <h1>{match.title}</h1>
              <p className="pl-muted">{match.teamA.name} vs {match.teamB.name}{match.venue ? ` · ${match.venue}` : ""}</p>
              <div className="pl-actions-row wrap"><button type="button" className="pl-btn" onClick={() => window.print()}>প্রিন্ট / PDF</button></div>
            </div>
            <div className="pl-card-block">
              <Scorecard match={match} />
            </div>
            <div className="pl-sheet-card">
              <h2>Current player totals</h2>
              <table className="pl-sheet-table">
                <thead><tr><th>Player</th><th>Runs</th><th>Wickets</th></tr></thead>
                <tbody>
                  {records.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.runs}</td><td>{r.wickets}</td></tr>)}
                </tbody>
              </table>
            </div>
          </>
        ) : <p className="pl-muted">লোড হচ্ছে…</p>}
      </div>
    </div>
  );
}
