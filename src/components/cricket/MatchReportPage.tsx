"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchSummary } from "./MatchSummary";
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
      <div className="pl-team-sheet pl-match-report-sheet">
        <header className="pl-topbar no-print">
          <Link href={`/cricket/t/${slug}/m/${matchId}`}>← লাইভ</Link>
          <span>ম্যাচ রিপোর্ট</span>
        </header>
        {match ? (
          <>
            <div className="pl-sheet-toolbar no-print">
              <div className="pl-actions-row wrap">
                <button type="button" className="pl-btn" onClick={() => window.print()}>
                  প্রিন্ট / PDF
                </button>
              </div>
            </div>
            <MatchSummary match={match} variant="page" />
            <div className="pl-sheet-card">
              <h2>টুর্নামেন্টে প্লেয়ার মোট</h2>
              <table className="pl-sheet-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Runs</th>
                    <th>Wickets</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.runs}</td>
                      <td>{r.wickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="pl-muted">লোড হচ্ছে…</p>
        )}
      </div>
    </div>
  );
}
