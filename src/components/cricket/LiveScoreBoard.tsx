"use client";

import {
  formatOvers,
  formatScore,
  matchHeadline,
  requiredRate,
  resultText,
  runRate,
  statusLabel,
} from "@/lib/cricket/format";
import type { Match } from "@/lib/cricket/types";

export function LiveScoreBoard({ match, accent }: { match: Match; accent?: string }) {
  const inn = match.innings[match.currentInningsIndex];
  const batting = inn?.battingTeam === "a" ? match.teamA : match.teamB;
  const bowling = inn?.battingTeam === "a" ? match.teamB : match.teamA;
  const striker = inn?.batters.find((b) => b.playerId === inn.strikerId);
  const nonStriker = inn?.batters.find((b) => b.playerId === inn.nonStrikerId);
  const bowler = inn?.bowlers.find((b) => b.playerId === inn.bowlerId);
  const rr = runRate(inn);
  const rrr = requiredRate(match);
  const result = resultText(match);
  const color = accent || "#0B6E4F";

  return (
    <section className="pl-board" style={{ ["--pl-accent" as string]: color }}>
      <header className="pl-board-top">
        <div>
          <p className="pl-kicker">{match.title}</p>
          <h1>
            {match.teamA.name} <span>vs</span> {match.teamB.name}
          </h1>
          {match.venue ? <p className="pl-muted">{match.venue}</p> : null}
        </div>
        <span className={`pl-status pl-status-${match.status}`}>{statusLabel(match.status)}</span>
      </header>

      <div className="pl-score-hero">
        <div>
          <p className="pl-team-line">{batting.name}</p>
          <p className="pl-big-score">{formatScore(inn)}</p>
          <p className="pl-overs">ওভার {formatOvers(inn)} · RR {rr}</p>
        </div>
        <div className="pl-score-meta">
          <p>
            বোলিং: <strong>{bowling.short}</strong>
          </p>
          {match.target ? (
            <p>
              টার্গেট: <strong>{match.target}</strong>
              {rrr ? ` · RRR ${rrr}` : ""}
            </p>
          ) : (
            <p>{matchHeadline(match)}</p>
          )}
          {result ? <p className="pl-result">{result}</p> : null}
        </div>
      </div>

      <div className="pl-players-row">
        <div>
          <span>স্ট্রাইকার *</span>
          <strong>
            {striker?.name || "—"} {striker ? `${striker.runs}(${striker.balls})` : ""}
          </strong>
        </div>
        <div>
          <span>নন-স্ট্রাইক</span>
          <strong>
            {nonStriker?.name || "—"} {nonStriker ? `${nonStriker.runs}(${nonStriker.balls})` : ""}
          </strong>
        </div>
        <div>
          <span>বোলার</span>
          <strong>
            {bowler?.name || "—"}{" "}
            {bowler
              ? `${Math.floor(bowler.balls / 6)}.${bowler.balls % 6}-${bowler.runs}-${bowler.wickets}`
              : ""}
          </strong>
        </div>
      </div>

      <div className="pl-recent">
        <span>Recent</span>
        <div>
          {(inn?.recentBalls || []).slice(-12).map((b, i) => (
            <em key={`${b}-${i}`} className={b === "W" ? "is-w" : undefined}>
              {b}
            </em>
          ))}
        </div>
      </div>
    </section>
  );
}
