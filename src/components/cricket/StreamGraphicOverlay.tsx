"use client";

import { formatOvers, formatScheduleWhen, formatScore, runRate } from "@/lib/cricket/format";
import { battingXiRows, bowlingXiRows } from "@/lib/cricket/lineup";
import { findPlayerTeamReport, roleLabel, roleLabelBn } from "@/lib/cricket/stats";
import type { Match, MatchScheduleItem, PlayerRecord, PlayerTeamReport } from "@/lib/cricket/types";

function sr(runs: number, balls: number): string {
  if (balls <= 0) return "0.0";
  return ((runs / balls) * 100).toFixed(1);
}

function bowlFig(balls: number, maidens: number, runs: number, wickets: number): string {
  return `${Math.floor(balls / 6)}.${balls % 6}-${maidens}-${runs}-${wickets}`;
}

type Props = {
  match: Match;
  records?: PlayerRecord[];
  upcomingMatches?: MatchScheduleItem[];
  playerTeamReports?: PlayerTeamReport[];
};

/** International-style performance graphic overlaid on the live stream */
export function StreamGraphicOverlay({
  match,
  records = [],
  upcomingMatches = [],
  playerTeamReports = [],
}: Props) {
  const kind = match.graphic?.kind || "hidden";
  if (kind === "hidden") return null;

  const inn = match.innings[match.currentInningsIndex];
  const batting = inn ? (inn.battingTeam === "a" ? match.teamA : match.teamB) : match.teamA;
  const bowling = inn ? (inn.battingTeam === "a" ? match.teamB : match.teamA) : match.teamB;
  const striker = inn?.batters.find((b) => b.playerId === inn.strikerId);
  const nonStriker = inn?.batters.find((b) => b.playerId === inn.nonStrikerId);
  const bowler = inn?.bowlers.find((b) => b.playerId === inn.bowlerId);
  const partnershipRuns = (striker?.runs || 0) + (nonStriker?.runs || 0);
  const partnershipBalls = (striker?.balls || 0) + (nonStriker?.balls || 0);

  const batRows = inn ? battingXiRows(match, inn) : [];
  const bowlRows = inn ? bowlingXiRows(match, inn) : [];
  const extrasTotal = inn ? inn.extras.wd + inn.extras.nb + inn.extras.b + inn.extras.lb : 0;

  const focusPlayer = match.players.find((p) => p.id === match.graphic?.playerId);
  const focusBat = inn?.batters.find((b) => b.playerId === match.graphic?.playerId);
  const focusBowl = inn?.bowlers.find((b) => b.playerId === match.graphic?.playerId);
  const career = records.find((r) => r.id === match.graphic?.playerId);
  const teamSplit = findPlayerTeamReport(playerTeamReports, focusPlayer);
  const schedule = (upcomingMatches && upcomingMatches.length > 0)
    ? upcomingMatches
    : (match.graphic?.schedule || []);

  if (kind === "schedule") {
    return (
      <div className="pl-graphic-layer" aria-live="polite">
        <aside className="pl-graphic pl-graphic-xi pl-graphic-schedule pl-graphic-glow animate-scorecard">
          <p className="pl-graphic-label">NEXT MATCH</p>
          {schedule.length === 0 ? (
            <p className="pl-graphic-note">কোনো next match schedule নেই</p>
          ) : (
            <ul className="pl-schedule-list">
              {schedule.map((m, i) => (
                <li key={m.id} className={i === 0 ? "on" : undefined}>
                  <div>
                    <strong>{m.teamA.short} vs {m.teamB.short}</strong>
                    <span>{m.teamA.name} vs {m.teamB.name}</span>
                    <small>{m.title}{m.venue ? ` · ${m.venue}` : ""} · {m.format}</small>
                  </div>
                  <em>{formatScheduleWhen(m.scheduledAt)}</em>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    );
  }

  if (kind === "player_teams" && focusPlayer) {
    return (
      <div className="pl-graphic-layer" aria-live="polite">
        <aside className="pl-graphic pl-graphic-xi pl-graphic-glow animate-scorecard">
          <p className="pl-graphic-label">PLAYER vs TEAMS</p>
          <h3>{focusPlayer.name}</h3>
          <p className={`pl-role-pill pl-role-${focusPlayer.role}`}>{roleLabelBn(focusPlayer.role)}</p>
          {teamSplit && teamSplit.vs.length > 0 ? (
            <table className="pl-xi-table">
              <thead>
                <tr>
                  <th>দলের বিপক্ষে</th>
                  <th>M</th>
                  <th>Runs</th>
                  <th>Wkts</th>
                </tr>
              </thead>
              <tbody>
                {teamSplit.vs.map((row) => (
                  <tr key={row.teamName}>
                    <td>{row.teamName} <small>({row.teamShort})</small></td>
                    <td>{row.matches}</td>
                    <td>{row.runs}{row.balls ? ` (${row.balls})` : ""}</td>
                    <td>{row.wickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="pl-graphic-note">এই টুর্নামেন্টে এখনো দলভিত্তিক রেকর্ড নেই</p>
          )}
          {teamSplit && teamSplit.forTeams.length > 0 ? (
            <div className="pl-graphic-foot">
              {teamSplit.forTeams.map((row) => (
                <span key={row.teamName}>{row.teamShort}: {row.runs} রান, {row.wickets} উইকেট</span>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    );
  }

  if (!inn) return null;

  return (
    <div className="pl-graphic-layer" aria-live="polite">
      {kind === "batter" && striker ? (
        <aside className="pl-graphic pl-graphic-player pl-graphic-glow animate-scorecard">
          <p className="pl-graphic-label">BATTER</p>
          <h3>{striker.name}</h3>
          <p className="pl-graphic-big">
            {striker.runs}
            <small>({striker.balls})</small>
          </p>
          <div className="pl-graphic-stats">
            <span>4s <b>{striker.fours}</b></span>
            <span>6s <b>{striker.sixes}</b></span>
            <span>SR <b>{sr(striker.runs, striker.balls)}</b></span>
          </div>
          <p className="pl-graphic-foot">{batting.short} {formatScore(inn)} ({formatOvers(inn)})</p>
        </aside>
      ) : null}

      {kind === "bowler" && bowler ? (
        <aside className="pl-graphic pl-graphic-player pl-graphic-glow animate-scorecard">
          <p className="pl-graphic-label">BOWLER</p>
          <h3>{bowler.name}</h3>
          <p className="pl-graphic-big">{bowlFig(bowler.balls, bowler.maidens, bowler.runs, bowler.wickets)}</p>
          <div className="pl-graphic-stats">
            <span>W <b>{bowler.wickets}</b></span>
            <span>R <b>{bowler.runs}</b></span>
            <span>Econ <b>{bowler.balls ? ((bowler.runs * 6) / bowler.balls).toFixed(1) : "0.0"}</b></span>
          </div>
          <p className="pl-graphic-foot">{bowling.name}</p>
        </aside>
      ) : null}

      {kind === "partnership" ? (
        <aside className="pl-graphic pl-graphic-wide pl-graphic-glow animate-scorecard">
          <p className="pl-graphic-label">PARTNERSHIP</p>
          <p className="pl-graphic-big">
            {partnershipRuns}
            <small> ({partnershipBalls} balls)</small>
          </p>
          <div className="pl-graphic-pair">
            <div>
              <strong>{striker?.name || "—"} *</strong>
              <span>{striker ? `${striker.runs}(${striker.balls})` : ""}</span>
            </div>
            <div>
              <strong>{nonStriker?.name || "—"}</strong>
              <span>{nonStriker ? `${nonStriker.runs}(${nonStriker.balls})` : ""}</span>
            </div>
          </div>
        </aside>
      ) : null}

      {kind === "batting" ? (
        <aside className="pl-graphic pl-graphic-xi pl-graphic-glow animate-scorecard">
          <div className="pl-xi-head">
            <div>
              <p className="pl-graphic-label">BATTING XI</p>
              <h3>{batting.name}</h3>
            </div>
            <div className="pl-xi-score">
              <strong>
                {formatScore(inn)} <small>({formatOvers(inn)} ov)</small>
              </strong>
              <span>RR {runRate(inn)}</span>
            </div>
          </div>
          <table className="pl-xi-table">
            <thead>
              <tr>
                <th>Batter</th>
                <th>Role</th>
                <th>R</th>
                <th>B</th>
                <th>4s</th>
                <th>6s</th>
                <th>SR</th>
              </tr>
            </thead>
            <tbody>
              {batRows.map((b, i) => (
                <tr
                  key={b.playerId}
                  className={b.status === "batting" ? "on" : b.status === "yet" ? "yet" : "out"}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <td>
                    <span className="pl-xi-name">
                      {b.name}
                      {b.status === "batting" ? " *" : ""}
                    </span>
                    {b.status === "out" && b.howOut ? <small className="pl-xi-how">{b.howOut}</small> : null}
                    {b.status === "yet" ? <small className="pl-xi-how">yet to bat</small> : null}
                  </td>
                  <td><em className={`pl-role pl-role-${b.role}`}>{roleLabel(b.role)}</em></td>
                  <td>{b.status === "yet" ? "—" : b.runs}</td>
                  <td>{b.status === "yet" ? "—" : b.balls}</td>
                  <td>{b.status === "yet" ? "—" : b.fours}</td>
                  <td>{b.status === "yet" ? "—" : b.sixes}</td>
                  <td>{b.status === "yet" ? "—" : b.strikeRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pl-xi-foot">
            <span>Extras {extrasTotal}</span>
            <strong>Total {inn.runs}/{inn.wickets}</strong>
          </div>
        </aside>
      ) : null}

      {kind === "bowling" ? (
        <aside className="pl-graphic pl-graphic-xi pl-graphic-glow animate-scorecard">
          <div className="pl-xi-head">
            <div>
              <p className="pl-graphic-label">BOWLING</p>
              <h3>{bowling.name}</h3>
            </div>
            <div className="pl-xi-score">
              <strong>vs {batting.short}</strong>
              <span>{formatScore(inn)} ({formatOvers(inn)})</span>
            </div>
          </div>
          <p className="pl-graphic-note">বোলার/অলরাউন্ডার + যারা আসলে বল করেছেন</p>
          <table className="pl-xi-table">
            <thead>
              <tr>
                <th>Bowler</th>
                <th>Role</th>
                <th>O</th>
                <th>M</th>
                <th>R</th>
                <th>W</th>
                <th>Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowlRows.map((b, i) => (
                <tr
                  key={b.playerId}
                  className={b.active ? "on" : !b.hasBowled ? "yet" : undefined}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <td>
                    <span className="pl-xi-name">
                      {b.name}
                      {b.active ? " *" : ""}
                    </span>
                    {!b.listedBowler && b.hasBowled ? (
                      <small className="pl-xi-how">part-time bowling</small>
                    ) : !b.hasBowled ? (
                      <small className="pl-xi-how">not bowled</small>
                    ) : null}
                  </td>
                  <td><em className={`pl-role pl-role-${b.role}`}>{roleLabel(b.role)}</em></td>
                  <td>{Math.floor(b.balls / 6)}.{b.balls % 6}</td>
                  <td>{b.maidens}</td>
                  <td>{b.runs}</td>
                  <td>{b.wickets}</td>
                  <td>{b.economy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      ) : null}

      {kind === "teams" ? (
        <aside className="pl-graphic pl-graphic-xi pl-graphic-split pl-graphic-glow animate-scorecard">
          <div className="pl-xi-split">
            <div>
              <p className="pl-graphic-label">BATTING — {batting.short}</p>
              <p className="pl-xi-mini-score">{formatScore(inn)} ({formatOvers(inn)})</p>
              <ul className="pl-xi-mini-list">
                {batRows.map((b) => (
                  <li key={b.playerId} className={b.status === "batting" ? "on" : undefined}>
                    <span>
                      {b.name} <i className={`pl-role pl-role-${b.role}`}>{roleLabel(b.role)}</i>
                      {b.status === "batting" ? " *" : ""}
                    </span>
                    <strong>{b.status === "yet" ? "—" : `${b.runs}(${b.balls})`}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="pl-graphic-label">BOWLING — {bowling.short}</p>
              <p className="pl-xi-mini-score">Bowler performance</p>
              <ul className="pl-xi-mini-list">
                {bowlRows.map((b) => (
                  <li key={b.playerId} className={b.active ? "on" : undefined}>
                    <span>
                      {b.name} <i className={`pl-role pl-role-${b.role}`}>{roleLabel(b.role)}</i>
                      {b.active ? " *" : ""}
                    </span>
                    <strong>{b.hasBowled ? b.figures : "—"}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      ) : null}

      {kind === "player" && focusPlayer ? (
        <aside className="pl-graphic pl-graphic-player pl-graphic-glow animate-scorecard">
          <p className="pl-graphic-label">PLAYER PERFORMANCE</p>
          <h3>{focusPlayer.name}</h3>
          <p className={`pl-role-pill pl-role-${focusPlayer.role}`}>{roleLabelBn(focusPlayer.role)}</p>
          <div className="pl-graphic-stats stacked">
            <span>এই ম্যাচ ব্যাটিং <b>{focusBat ? `${focusBat.runs}(${focusBat.balls})` : "—"}</b></span>
            <span>এই ম্যাচ বোলিং <b>{focusBowl ? bowlFig(focusBowl.balls, focusBowl.maidens, focusBowl.runs, focusBowl.wickets) : "—"}</b></span>
            {career ? (
              <>
                <span>ক্যারিয়ার রান <b>{career.runs}</b></span>
                <span>ক্যারিয়ার উইকেট <b>{career.wickets}</b></span>
              </>
            ) : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
