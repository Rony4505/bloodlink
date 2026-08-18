"use client";

import {
  formatOvers,
  formatScore,
  requiredRate,
  resultText,
  runRate,
  statusLabel,
} from "@/lib/cricket/format";
import type { Match } from "@/lib/cricket/types";

/** TV-style score strip under the live stream (like international broadcasts). */
export function BroadcastScoreLine({ match, accent }: { match: Match; accent?: string }) {
  const inn = match.innings[match.currentInningsIndex];
  const batting = inn?.battingTeam === "a" ? match.teamA : match.teamB;
  const bowling = inn?.battingTeam === "a" ? match.teamB : match.teamA;
  const striker = inn?.batters.find((b) => b.playerId === inn.strikerId);
  const nonStriker = inn?.batters.find((b) => b.playerId === inn.nonStrikerId);
  const bowler = inn?.bowlers.find((b) => b.playerId === inn.bowlerId);
  const rr = runRate(inn);
  const rrr = requiredRate(match);
  const result = resultText(match);
  const overBalls = inn?.currentOverBalls || [];
  const color = accent || "#0B6E4F";

  function bowlFigures() {
    if (!bowler) return "—";
    const o = `${Math.floor(bowler.balls / 6)}.${bowler.balls % 6}`;
    return `${o}-${bowler.maidens}-${bowler.runs}-${bowler.wickets}`;
  }

  return (
    <div className="pl-scoreline" style={{ ["--pl-accent" as string]: color }}>
      <div className="pl-scoreline-main">
        <span className={`pl-scoreline-live pl-status-${match.status}`}>
          {match.status === "live" ? "● LIVE" : statusLabel(match.status)}
        </span>
        {inn?.freeHit ? (
          <div className="pl-scoreline-freehit" aria-live="assertive">
            FREE HIT
          </div>
        ) : null}

        <div className="pl-scoreline-score">
          <strong className="pl-scoreline-team">{batting.short}</strong>
          <strong className="pl-scoreline-runs">{formatScore(inn)}</strong>
          <span className="pl-scoreline-ov">({formatOvers(inn)} ov)</span>
        </div>

        <div className="pl-scoreline-vs">
          <span>
            {match.teamA.short} vs {match.teamB.short}
          </span>
          {match.target ? (
            <span>
              Target {match.target}
              {rrr ? ` · RRR ${rrr}` : ""}
            </span>
          ) : (
            <span>RR {rr}</span>
          )}
        </div>

        {result ? <div className="pl-scoreline-result">{result}</div> : null}
      </div>

      <div className="pl-scoreline-players">
        <div className="pl-scoreline-bat">
          <span className="is-strike">
            {striker?.name || "Batter *"} {striker ? `${striker.runs}${striker.out ? "" : "*"}(${striker.balls})` : ""}
          </span>
          <span>
            {nonStriker?.name || "Batter"} {nonStriker ? `${nonStriker.runs}(${nonStriker.balls})` : ""}
          </span>
        </div>
        <div className="pl-scoreline-bowl">
          <span>
            {bowling.short}: {bowler?.name || "Bowler"} {bowlFigures()}
          </span>
        </div>
        <div className="pl-scoreline-balls" aria-label="This over">
          {overBalls.length === 0 ? <em className="empty">—</em> : null}
          {overBalls.map((b, i) => (
            <em key={`${b}-${i}`} className={b === "W" || b.startsWith("W") ? "is-w" : b === "4" || b === "6" ? "is-boundary" : b.startsWith("NB") ? "is-nb" : undefined}>
              {b}
            </em>
          ))}
          {inn?.freeHit ? <em className="is-freehit">FH</em> : null}
        </div>
      </div>
    </div>
  );
}
