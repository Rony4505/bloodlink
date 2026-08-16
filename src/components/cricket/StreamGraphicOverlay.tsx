"use client";

import { formatOvers, formatScore, runRate } from "@/lib/cricket/format";
import type { Match } from "@/lib/cricket/types";

function sr(runs: number, balls: number): string {
  if (balls <= 0) return "0.0";
  return ((runs / balls) * 100).toFixed(1);
}

function bowlFig(balls: number, maidens: number, runs: number, wickets: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}-${maidens}-${runs}-${wickets}`;
}

/** International-style performance graphic overlaid on the live stream */
export function StreamGraphicOverlay({ match }: { match: Match }) {
  const kind = match.graphic?.kind || "hidden";
  if (kind === "hidden") return null;

  const inn = match.innings[match.currentInningsIndex];
  if (!inn) return null;

  const batting = inn.battingTeam === "a" ? match.teamA : match.teamB;
  const bowling = inn.battingTeam === "a" ? match.teamB : match.teamA;
  const striker = inn.batters.find((b) => b.playerId === inn.strikerId);
  const nonStriker = inn.batters.find((b) => b.playerId === inn.nonStrikerId);
  const bowler = inn.bowlers.find((b) => b.playerId === inn.bowlerId);
  const partnershipRuns = (striker?.runs || 0) + (nonStriker?.runs || 0);
  const partnershipBalls = (striker?.balls || 0) + (nonStriker?.balls || 0);

  return (
    <div className="pl-graphic-layer" aria-live="polite">
      {kind === "batter" && striker ? (
        <aside className="pl-graphic pl-graphic-player animate-in">
          <p className="pl-graphic-label">BATTER</p>
          <h3>{striker.name}</h3>
          <p className="pl-graphic-big">
            {striker.runs}
            <small>({striker.balls})</small>
          </p>
          <div className="pl-graphic-stats">
            <span>
              4s <b>{striker.fours}</b>
            </span>
            <span>
              6s <b>{striker.sixes}</b>
            </span>
            <span>
              SR <b>{sr(striker.runs, striker.balls)}</b>
            </span>
          </div>
          <p className="pl-graphic-foot">
            {batting.short} {formatScore(inn)} ({formatOvers(inn)})
          </p>
        </aside>
      ) : null}

      {kind === "bowler" && bowler ? (
        <aside className="pl-graphic pl-graphic-player animate-in">
          <p className="pl-graphic-label">BOWLER</p>
          <h3>{bowler.name}</h3>
          <p className="pl-graphic-big">{bowlFig(bowler.balls, bowler.maidens, bowler.runs, bowler.wickets)}</p>
          <div className="pl-graphic-stats">
            <span>
              W <b>{bowler.wickets}</b>
            </span>
            <span>
              R <b>{bowler.runs}</b>
            </span>
            <span>
              Econ <b>{bowler.balls ? ((bowler.runs * 6) / bowler.balls).toFixed(1) : "0.0"}</b>
            </span>
          </div>
          <p className="pl-graphic-foot">{bowling.name}</p>
        </aside>
      ) : null}

      {kind === "partnership" ? (
        <aside className="pl-graphic pl-graphic-wide animate-in">
          <p className="pl-graphic-label">PARTNERSHIP</p>
          <p className="pl-graphic-big">
            {partnershipRuns}
            <small> ({partnershipBalls} balls)</small>
          </p>
          <div className="pl-graphic-pair">
            <div>
              <strong>{striker?.name || "—"} *</strong>
              <span>
                {striker ? `${striker.runs}(${striker.balls})` : ""}
              </span>
            </div>
            <div>
              <strong>{nonStriker?.name || "—"}</strong>
              <span>
                {nonStriker ? `${nonStriker.runs}(${nonStriker.balls})` : ""}
              </span>
            </div>
          </div>
        </aside>
      ) : null}

      {kind === "batting" ? (
        <aside className="pl-graphic pl-graphic-card animate-in">
          <p className="pl-graphic-label">
            {batting.name} — BATTING · {formatScore(inn)} ({formatOvers(inn)}) · RR {runRate(inn)}
          </p>
          <table>
            <tbody>
              {inn.batters.slice(0, 8).map((b) => (
                <tr key={b.playerId} className={!b.out ? "on" : undefined}>
                  <td>
                    {b.name}
                    {!b.out ? " *" : ""}
                  </td>
                  <td>
                    {b.runs}({b.balls})
                  </td>
                  <td>{sr(b.runs, b.balls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      ) : null}

      {kind === "bowling" ? (
        <aside className="pl-graphic pl-graphic-card animate-in">
          <p className="pl-graphic-label">{bowling.name} — BOWLING</p>
          <table>
            <tbody>
              {inn.bowlers.slice(0, 8).map((b) => (
                <tr key={b.playerId} className={b.playerId === inn.bowlerId ? "on" : undefined}>
                  <td>{b.name}</td>
                  <td>{bowlFig(b.balls, b.maidens, b.runs, b.wickets)}</td>
                  <td>{b.balls ? ((b.runs * 6) / b.balls).toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      ) : null}

      {kind === "teams" ? (
        <aside className="pl-graphic pl-graphic-teams animate-in">
          <p className="pl-graphic-label">TEAM PERFORMANCE</p>
          <div className="pl-graphic-team-row">
            {match.innings.map((row, idx) => {
              const team = row.battingTeam === "a" ? match.teamA : match.teamB;
              return (
                <div key={idx} className={idx === match.currentInningsIndex ? "on" : undefined}>
                  <strong>{team.short}</strong>
                  <span className="pl-graphic-big-sm">
                    {formatScore(row)} <small>({formatOvers(row)})</small>
                  </span>
                  <em>RR {runRate(row)}</em>
                </div>
              );
            })}
            {match.innings.length === 1 ? (
              <div>
                <strong>{bowling.short}</strong>
                <span className="pl-graphic-big-sm">Yet to bat</span>
                <em>{match.format}</em>
              </div>
            ) : null}
          </div>
          {match.target ? <p className="pl-graphic-foot">Target {match.target}</p> : null}
        </aside>
      ) : null}
    </div>
  );
}
