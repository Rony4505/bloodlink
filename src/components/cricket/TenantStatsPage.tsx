"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { batterAverage, bowlEconomy, roleLabelBn, strikeRate } from "@/lib/cricket/stats";
import type { MatchHistoryRow, PlayerRecord, PlayerTeamReport, TeamStanding } from "@/lib/cricket/types";
import "./cricket.css";

type TenantStatsData = {
  tenant: { name: string; slug: string };
  playerRecords: PlayerRecord[];
  playerTeamReports: PlayerTeamReport[];
  teamStandings: TeamStanding[];
  matchHistory: MatchHistoryRow[];
};

export function TenantStatsPage({ slug }: { slug: string }) {
  const [data, setData] = useState<TenantStatsData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"player" | "team" | "matches">("player");
  const [playerKey, setPlayerKey] = useState("");

  useEffect(() => {
    fetch(`/api/cricket/tenants?slug=${encodeURIComponent(slug)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "লোড ব্যর্থ");
        setData(d);
        if (d.playerTeamReports?.[0]?.key) setPlayerKey(d.playerTeamReports[0].key);
      })
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  const selected = (data?.playerTeamReports || []).find((r) => r.key === playerKey);

  return (
    <div className="pl-shell">
      <div className="pl-team-sheet">
        <header className="pl-topbar no-print">
          <Link href={`/cricket/t/${slug}`}>← ক্লাব</Link>
          <span>টুর্নামেন্ট Stats</span>
        </header>
        <div className="pl-sheet-toolbar no-print">
          <h1>{data?.tenant.name || "Tournament Stats"}</h1>
          <p className="pl-muted">ম্যাচ ফলাফল, খেলোয়াড় ও দল রিপোর্ট — প্রিন্ট / PDF করা যায়</p>
          <div className="pl-tabs">
            <button type="button" className={tab === "matches" ? "on" : ""} onClick={() => setTab("matches")}>
              ম্যাচ ফলাফল
            </button>
            <button type="button" className={tab === "player" ? "on" : ""} onClick={() => setTab("player")}>
              খেলোয়াড় রিপোর্ট
            </button>
            <button type="button" className={tab === "team" ? "on" : ""} onClick={() => setTab("team")}>
              দল রিপোর্ট
            </button>
          </div>
          <div className="pl-actions-row wrap">
            <button type="button" className="pl-btn" onClick={() => window.print()}>
              প্রিন্ট / PDF
            </button>
          </div>
          {error ? <p className="pl-error">{error}</p> : null}
        </div>

        {tab === "matches" ? (
          <div className="pl-sheet-card">
            <h2>ম্যাচ ফলাফল (জয় / পরাজয়)</h2>
            <table className="pl-sheet-table">
              <thead>
                <tr>
                  <th>ম্যাচ</th>
                  <th>স্কোর</th>
                  <th>জয়ী</th>
                  <th>পরাজিত</th>
                  <th>ফলাফল</th>
                  <th className="no-print">রিপোর্ট</th>
                </tr>
              </thead>
              <tbody>
                {(data?.matchHistory || []).map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.title}
                      <br />
                      <small>
                        {m.teamA.name} vs {m.teamB.name}
                      </small>
                    </td>
                    <td>{m.scoreLine}</td>
                    <td className={m.winnerSide === "a" || m.winnerSide === "b" ? "pl-win-cell" : ""}>
                      {m.winnerName}
                    </td>
                    <td className="pl-lose-cell">{m.loserName}</td>
                    <td>{m.resultText}</td>
                    <td className="no-print">
                      <Link href={`/cricket/t/${slug}/m/${m.id}/report`}>দেখুন</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data?.matchHistory || []).length === 0 ? (
              <p className="pl-muted">এখনো কোনো সম্পন্ন ম্যাচ নেই</p>
            ) : null}
          </div>
        ) : null}

        {tab === "player" ? (
          <div>
            <div className="pl-sheet-card">
              <h2>খেলোয়াড় অনুযায়ী</h2>
              <table className="pl-sheet-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Role</th>
                    <th>M</th>
                    <th>Inn</th>
                    <th>Runs</th>
                    <th>Avg</th>
                    <th>SR</th>
                    <th>4s</th>
                    <th>6s</th>
                    <th>Wkts</th>
                    <th>Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.playerRecords || []).map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{roleLabelBn(r.role)}</td>
                      <td>{r.matches}</td>
                      <td>{r.innings}</td>
                      <td>{r.runs}</td>
                      <td>{batterAverage(r.runs, r.innings)}</td>
                      <td>{strikeRate(r.runs, r.balls)}</td>
                      <td>{r.fours}</td>
                      <td>{r.sixes}</td>
                      <td>{r.wickets}</td>
                      <td>{bowlEconomy(r.bowlRuns, r.bowlBalls)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(data?.playerTeamReports || []).length > 0 ? (
              <div className="pl-sheet-card" style={{ marginTop: "1rem" }}>
                <h2>প্লেয়ার × দল</h2>
                <label className="pl-note no-print">
                  প্লেয়ার বাছুন
                  <select value={playerKey} onChange={(e) => setPlayerKey(e.target.value)}>
                    {(data?.playerTeamReports || []).map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
                {selected ? (
                  <>
                    <h3 className="print-only">{selected.name} — দল অনুযায়ী</h3>
                    <table className="pl-sheet-table">
                      <thead>
                        <tr>
                          <th>বিপক্ষ দল</th>
                          <th>Matches</th>
                          <th>Runs</th>
                          <th>Balls</th>
                          <th>Wickets</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.vs.map((row) => (
                          <tr key={row.teamName}>
                            <td>
                              {row.teamName} ({row.teamShort})
                            </td>
                            <td>{row.matches}</td>
                            <td>{row.runs}</td>
                            <td>{row.balls}</td>
                            <td>{row.wickets}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "team" ? (
          <div className="pl-sheet-card">
            <h2>দল অনুযায়ী</h2>
            <table className="pl-sheet-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>M</th>
                  <th>W</th>
                  <th>L</th>
                  <th>T</th>
                  <th>NR</th>
                  <th>Runs</th>
                  <th>Wkts</th>
                  <th>NRR</th>
                </tr>
              </thead>
              <tbody>
                {(data?.teamStandings || []).map((t) => (
                  <tr key={t.name}>
                    <td>
                      {t.name} ({t.short})
                    </td>
                    <td>{t.matches}</td>
                    <td>{t.won}</td>
                    <td>{t.lost}</td>
                    <td>{t.tied}</td>
                    <td>{t.nr}</td>
                    <td>{t.runsFor}</td>
                    <td>{t.wicketsTaken}</td>
                    <td>{t.nrr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data?.teamStandings || []).length === 0 ? (
              <p className="pl-muted">এখনো completed ম্যাচ নেই — খেলা শেষ হলে টেবিল আসবে</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
