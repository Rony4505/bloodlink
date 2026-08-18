import { formatOvers, formatScore } from "./format";
import type { Innings, Match, MatchHistoryRow, MatchResult, TeamSide } from "./types";

export type { MatchHistoryRow, MatchResult };

function teamOf(match: Match, side: TeamSide) {
  return side === "a" ? match.teamA : match.teamB;
}

function innScoreLine(inn: Innings | undefined): string {
  if (!inn) return "—";
  return `${formatScore(inn)} (${formatOvers(inn)} ov)`;
}

/** Compute official result when a match is marked complete. */
export function computeMatchResult(
  match: Match,
  opts?: { winnerSide?: TeamSide | "tie" | "nr" },
): MatchResult {
  const completedAt = new Date().toISOString();
  const first = match.innings[0];
  const second = match.innings[1];

  if (opts?.winnerSide === "tie") {
    return {
      winnerSide: "tie",
      winnerName: "—",
      loserName: "—",
      marginType: "tie",
      margin: 0,
      summaryBn: `${match.teamA.name} vs ${match.teamB.name} — ম্যাচ টাই`,
      summaryEn: `${match.teamA.short} vs ${match.teamB.short} — Match tied`,
      completedAt,
    };
  }

  if (opts?.winnerSide === "nr" || !first) {
    return {
      winnerSide: "nr",
      winnerName: "—",
      loserName: "—",
      marginType: "nr",
      margin: 0,
      summaryBn: `${match.teamA.name} vs ${match.teamB.name} — ফলাফল নেই (NR)`,
      summaryEn: `${match.teamA.short} vs ${match.teamB.short} — No result`,
      completedAt,
    };
  }

  if (opts?.winnerSide === "a" || opts?.winnerSide === "b") {
    const win = teamOf(match, opts.winnerSide);
    const lose = teamOf(match, opts.winnerSide === "a" ? "b" : "a");
    return {
      winnerSide: opts.winnerSide,
      winnerName: win.name,
      loserName: lose.name,
      marginType: second ? "runs" : "single",
      margin: 0,
      summaryBn: `${win.name} ${second ? "জিতেছে" : "ম্যাচ জিতেছে"} (${lose.name} পরাজিত)`,
      summaryEn: `${win.short} beat ${lose.short}`,
      completedAt,
    };
  }

  if (!second || second.legalBalls === 0 && second.runs === 0 && !second.completed) {
    const bat = teamOf(match, first.battingTeam);
    return {
      winnerSide: "nr",
      winnerName: "—",
      loserName: "—",
      marginType: "single",
      margin: 0,
      summaryBn: `${match.title} — ${bat.name} ${formatScore(first)} (${formatOvers(first)}). দ্বিতীয় ইনিংস হয়নি।`,
      summaryEn: `${bat.short} ${formatScore(first)} — single innings`,
      completedAt,
    };
  }

  const target = match.target ?? first.runs + 1;
  if (second.runs >= target) {
    const win = teamOf(match, second.battingTeam);
    const lose = teamOf(match, second.battingTeam === "a" ? "b" : "a");
    const wktsLeft = Math.max(0, 10 - second.wickets);
    return {
      winnerSide: second.battingTeam,
      winnerName: win.name,
      loserName: lose.name,
      marginType: "wickets",
      margin: wktsLeft,
      summaryBn: `${win.name} ${wktsLeft} উইকেটে জিতেছে (${lose.name} পরাজিত)`,
      summaryEn: `${win.short} won by ${wktsLeft} wicket${wktsLeft === 1 ? "" : "s"}`,
      completedAt,
    };
  }

  if (second.runs === first.runs) {
    return {
      winnerSide: "tie",
      winnerName: "—",
      loserName: "—",
      marginType: "tie",
      margin: 0,
      summaryBn: `${match.teamA.name} vs ${match.teamB.name} — ম্যাচ টাই (${first.runs} = ${second.runs})`,
      summaryEn: `Match tied at ${first.runs}`,
      completedAt,
    };
  }

  const win = teamOf(match, first.battingTeam);
  const lose = teamOf(match, first.battingTeam === "a" ? "b" : "a");
  const margin = first.runs - second.runs;
  return {
    winnerSide: first.battingTeam,
    winnerName: win.name,
    loserName: lose.name,
    marginType: "runs",
    margin,
    summaryBn: `${win.name} ${margin} রানে জিতেছে (${lose.name} পরাজিত)`,
    summaryEn: `${win.short} won by ${margin} runs`,
    completedAt,
  };
}

export function completeMatch(
  match: Match,
  opts?: { winnerSide?: TeamSide | "tie" | "nr" },
): Match {
  const next = structuredClone(match) as Match;
  for (const inn of next.innings) inn.completed = true;
  next.status = "completed";
  next.result = computeMatchResult(next, opts);
  next.updatedAt = new Date().toISOString();
  next.commentary.unshift({
    id: `c_${Date.now()}`,
    text: next.result.summaryBn,
    at: next.result.completedAt,
  });
  next.commentary = next.commentary.slice(0, 80);
  return next;
}

export function resultSummary(match: Match): string {
  if (match.result?.summaryBn) return match.result.summaryBn;
  if (match.status !== "completed") return "—";
  return computeMatchResult(match).summaryBn;
}

export function buildMatchHistory(matches: Match[]): MatchHistoryRow[] {
  return matches
    .filter((m) => m.status === "completed" || m.innings.some((i) => i.legalBalls > 0))
    .sort((a, b) => +new Date(b.result?.completedAt || b.updatedAt) - +new Date(a.result?.completedAt || a.updatedAt))
    .map((m) => {
      const res = m.result || (m.status === "completed" ? computeMatchResult(m) : null);
      const first = m.innings[0];
      const second = m.innings[1];
      const lineA = first
        ? `${first.battingTeam === "a" ? m.teamA.short : m.teamB.short} ${innScoreLine(first)}`
        : "";
      const lineB = second
        ? `${second.battingTeam === "a" ? m.teamA.short : m.teamB.short} ${innScoreLine(second)}`
        : "";
      const scoreLine = [lineA, lineB].filter(Boolean).join(" · ") || "—";

      return {
        id: m.id,
        title: m.title,
        venue: m.venue,
        format: m.format,
        status: m.status,
        teamA: m.teamA,
        teamB: m.teamB,
        scheduledAt: m.scheduledAt,
        completedAt: res?.completedAt || m.updatedAt,
        winnerName: res?.winnerName || "—",
        loserName: res?.loserName || "—",
        winnerSide: res?.winnerSide || "nr",
        resultText: res?.summaryBn || "—",
        scoreLine,
      };
    });
}
