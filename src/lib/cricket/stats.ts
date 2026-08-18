import type { Match, MatchScheduleItem, PlayerRecord, PlayerRole, PlayerTeamReport, PlayerTeamSplitRow, TeamStanding } from "./types";

function emptyRecord(id: string, name: string, role: PlayerRole): PlayerRecord {
  return {
    id,
    name,
    role,
    matches: 0,
    innings: 0,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    wickets: 0,
    bowlBalls: 0,
    bowlRuns: 0,
    maidens: 0,
    updatedAt: new Date().toISOString(),
  };
}

/** Rebuild this match’s contribution into tenant career records (idempotent replace per match players). */
export function upsertRecordsFromMatch(
  existing: PlayerRecord[],
  match: Match,
): PlayerRecord[] {
  const map = new Map(existing.map((r) => [r.id, { ...r }]));

  for (const p of match.players) {
    if (!map.has(p.id)) map.set(p.id, emptyRecord(p.id, p.name, p.role));
    const rec = map.get(p.id)!;
    rec.name = p.name;
    rec.role = p.role;
  }

  // Zero then re-add would need match-tagged stats; instead merge live totals from all matches
  // is done at store level. Here we update from THIS match’s current innings snapshot fields
  // by setting match-derived “live” values onto a side channel — simpler approach:
  // accumulate absolute from current match innings into a scratch and max-merge.

  const batTotals = new Map<string, { runs: number; balls: number; fours: number; sixes: number; innings: number }>();
  const bowlTotals = new Map<string, { balls: number; runs: number; wickets: number; maidens: number }>();

  for (const inn of match.innings) {
    for (const b of inn.batters) {
      const prev = batTotals.get(b.playerId) || { runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0 };
      batTotals.set(b.playerId, {
        runs: prev.runs + b.runs,
        balls: prev.balls + b.balls,
        fours: prev.fours + b.fours,
        sixes: prev.sixes + b.sixes,
        innings: prev.innings + (b.balls > 0 || b.out || b.runs > 0 ? 1 : 0),
      });
    }
    for (const b of inn.bowlers) {
      const prev = bowlTotals.get(b.playerId) || { balls: 0, runs: 0, wickets: 0, maidens: 0 };
      bowlTotals.set(b.playerId, {
        balls: prev.balls + b.balls,
        runs: prev.runs + b.runs,
        wickets: prev.wickets + b.wickets,
        maidens: prev.maidens + b.maidens,
      });
    }
  }

  // Store match-live stats under a namespaced key is hard without matchId on record.
  // We keep career as: existing career outside this match is unknown on first pass.
  // Practical approach for file store: keep `matchStats` embedded — for simplicity,
  // set record fields to at least the totals from this match (and keep higher if already larger
  // from same ongoing match updates). For multi-match career, recompute from all matches in store.

  for (const [id, t] of batTotals) {
    if (!map.has(id)) {
      const p = match.players.find((x) => x.id === id);
      map.set(id, emptyRecord(id, p?.name || id, p?.role || "batter"));
    }
    const rec = map.get(id)!;
    rec.runs = Math.max(rec.runs, t.runs);
    rec.balls = Math.max(rec.balls, t.balls);
    rec.fours = Math.max(rec.fours, t.fours);
    rec.sixes = Math.max(rec.sixes, t.sixes);
    rec.innings = Math.max(rec.innings, t.innings);
    rec.updatedAt = new Date().toISOString();
  }
  for (const [id, t] of bowlTotals) {
    if (!map.has(id)) {
      const p = match.players.find((x) => x.id === id);
      map.set(id, emptyRecord(id, p?.name || id, p?.role || "bowler"));
    }
    const rec = map.get(id)!;
    rec.bowlBalls = Math.max(rec.bowlBalls, t.balls);
    rec.bowlRuns = Math.max(rec.bowlRuns, t.runs);
    rec.wickets = Math.max(rec.wickets, t.wickets);
    rec.maidens = Math.max(rec.maidens, t.maidens);
    rec.updatedAt = new Date().toISOString();
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "bn"));
}

/** Recompute career records for a tenant from all their matches (accurate). */
export function recomputeTenantRecords(matches: Match[], tenantId: string): PlayerRecord[] {
  const map = new Map<string, PlayerRecord>();
  const tenantMatches = matches.filter((m) => m.tenantId === tenantId);

  for (const match of tenantMatches) {
    for (const p of match.players) {
      if (!map.has(p.id)) map.set(p.id, emptyRecord(p.id, p.name, p.role));
      const rec = map.get(p.id)!;
      rec.name = p.name;
      rec.role = p.role;
    }

    const played = new Set<string>();
    for (const inn of match.innings) {
      for (const b of inn.batters) {
        if (!map.has(b.playerId)) {
          map.set(b.playerId, emptyRecord(b.playerId, b.name, "batter"));
        }
        const rec = map.get(b.playerId)!;
        rec.runs += b.runs;
        rec.balls += b.balls;
        rec.fours += b.fours;
        rec.sixes += b.sixes;
        if (b.balls > 0 || b.out || b.runs > 0) rec.innings += 1;
        played.add(b.playerId);
      }
      for (const b of inn.bowlers) {
        if (!map.has(b.playerId)) {
          map.set(b.playerId, emptyRecord(b.playerId, b.name, "bowler"));
        }
        const rec = map.get(b.playerId)!;
        rec.bowlBalls += b.balls;
        rec.bowlRuns += b.runs;
        rec.wickets += b.wickets;
        rec.maidens += b.maidens;
        played.add(b.playerId);
      }
    }
    for (const id of played) {
      const rec = map.get(id)!;
      rec.matches += 1;
      rec.updatedAt = new Date().toISOString();
    }
  }

  return Array.from(map.values())
    .filter((r) => r.matches > 0 || r.runs > 0 || r.wickets > 0 || r.balls > 0 || r.bowlBalls > 0)
    .sort((a, b) => b.runs - a.runs || b.wickets - a.wickets);
}

export function roleLabel(role: PlayerRole): string {
  if (role === "batter") return "Batter";
  if (role === "bowler") return "Bowler";
  if (role === "allrounder") return "Allrounder";
  return "WK";
}

export function roleLabelBn(role: PlayerRole): string {
  if (role === "batter") return "ব্যাটার";
  if (role === "bowler") return "বোলার";
  if (role === "allrounder") return "অলরাউন্ডার";
  return "উইকেটকিপার";
}

function normName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function matchOutcome(match: Match): "a" | "b" | "tie" | "nr" {
  if (match.status !== "completed") return "nr";
  const first = match.innings[0];
  const second = match.innings[1];
  if (!first || !second) return "nr";
  if (second.runs > first.runs) return second.battingTeam;
  if (second.runs < first.runs) return first.battingTeam;
  return "tie";
}

type SplitAcc = PlayerTeamSplitRow;

function emptySplit(teamName: string, teamShort: string): SplitAcc {
  return { teamName, teamShort, matches: 0, runs: 0, balls: 0, wickets: 0, bowlBalls: 0, bowlRuns: 0 };
}

function bumpSplit(
  map: Map<string, SplitAcc>,
  teamName: string,
  teamShort: string,
  patch: Partial<SplitAcc> & { played?: boolean },
) {
  const key = normName(teamName) || teamName;
  const row = map.get(key) || emptySplit(teamName, teamShort);
  row.teamName = teamName || row.teamName;
  row.teamShort = teamShort || row.teamShort;
  if (patch.played) row.matches += 1;
  row.runs += patch.runs || 0;
  row.balls += patch.balls || 0;
  row.wickets += patch.wickets || 0;
  row.bowlBalls += patch.bowlBalls || 0;
  row.bowlRuns += patch.bowlRuns || 0;
  map.set(key, row);
}

function matchWasPlayed(match: Match): boolean {
  if (match.status === "completed" || match.status === "live") return true;
  return match.innings.some((inn) => inn.legalBalls > 0 || inn.runs > 0 || inn.wickets > 0);
}

/** Player batting/bowling totals vs each team and while playing for each team. */
export function buildPlayerTeamReports(matches: Match[]): PlayerTeamReport[] {
  type Acc = {
    key: string;
    name: string;
    role: PlayerRole;
    vs: Map<string, SplitAcc>;
    forTeams: Map<string, SplitAcc>;
  };
  const players = new Map<string, Acc>();

  function ensurePlayer(name: string, role: PlayerRole): Acc | null {
    const key = normName(name);
    if (!key) return null;
    const existing = players.get(key);
    if (existing) {
      existing.name = name;
      existing.role = role || existing.role;
      return existing;
    }
    const created: Acc = { key, name, role, vs: new Map(), forTeams: new Map() };
    players.set(key, created);
    return created;
  }

  for (const match of matches) {
    if (!matchWasPlayed(match) && match.status === "upcoming") continue;
    const counted = new Set<string>();
    for (const p of match.players) {
      const acc = ensurePlayer(p.name, p.role);
      if (!acc) continue;
      if (!matchWasPlayed(match)) continue;
      if (counted.has(acc.key)) continue;
      counted.add(acc.key);
      const forTeam = p.team === "a" ? match.teamA : match.teamB;
      const vsTeam = p.team === "a" ? match.teamB : match.teamA;
      bumpSplit(acc.forTeams, forTeam.name, forTeam.short, { played: true });
      bumpSplit(acc.vs, vsTeam.name, vsTeam.short, { played: true });
    }

    for (const inn of match.innings) {
      const batting = inn.battingTeam === "a" ? match.teamA : match.teamB;
      const bowling = inn.battingTeam === "a" ? match.teamB : match.teamA;
      for (const b of inn.batters) {
        const acc = ensurePlayer(b.name, "batter");
        if (!acc) continue;
        bumpSplit(acc.forTeams, batting.name, batting.short, { runs: b.runs, balls: b.balls });
        bumpSplit(acc.vs, bowling.name, bowling.short, { runs: b.runs, balls: b.balls });
      }
      for (const b of inn.bowlers) {
        const acc = ensurePlayer(b.name, "bowler");
        if (!acc) continue;
        bumpSplit(acc.forTeams, bowling.name, bowling.short, {
          wickets: b.wickets,
          bowlBalls: b.balls,
          bowlRuns: b.runs,
        });
        bumpSplit(acc.vs, batting.name, batting.short, {
          wickets: b.wickets,
          bowlBalls: b.balls,
          bowlRuns: b.runs,
        });
      }
    }
  }

  return Array.from(players.values())
    .map((p) => ({
      key: p.key,
      name: p.name,
      role: p.role,
      vs: Array.from(p.vs.values()).sort((a, b) => b.runs - a.runs || b.wickets - a.wickets),
      forTeams: Array.from(p.forTeams.values()).sort((a, b) => b.runs - a.runs || b.wickets - a.wickets),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "bn"));
}

export function findPlayerTeamReport(
  reports: PlayerTeamReport[],
  player: { id?: string; name: string } | undefined,
): PlayerTeamReport | undefined {
  if (!player) return undefined;
  const key = normName(player.name);
  return reports.find((r) => r.key === key);
}

/** Points-table style team report for a tournament/club. */
export function buildTeamStandings(matches: Match[]): TeamStanding[] {
  const map = new Map<string, TeamStanding>();

  function ensure(name: string, short: string): TeamStanding {
    const key = normName(name);
    const existing = map.get(key);
    if (existing) {
      if (short && !existing.short) existing.short = short;
      return existing;
    }
    const created: TeamStanding = {
      name,
      short,
      matches: 0,
      won: 0,
      lost: 0,
      tied: 0,
      nr: 0,
      runsFor: 0,
      ballsFor: 0,
      runsAgainst: 0,
      ballsAgainst: 0,
      wicketsTaken: 0,
      wicketsLost: 0,
      nrr: "0.000",
    };
    map.set(key, created);
    return created;
  }

  for (const match of matches) {
    if (!matchWasPlayed(match) && match.status === "upcoming") continue;
    const a = ensure(match.teamA.name, match.teamA.short);
    const b = ensure(match.teamB.name, match.teamB.short);

    for (const inn of match.innings) {
      const bat = inn.battingTeam === "a" ? a : b;
      const bowl = inn.battingTeam === "a" ? b : a;
      bat.runsFor += inn.runs;
      bat.ballsFor += inn.legalBalls;
      bat.wicketsLost += inn.wickets;
      bowl.runsAgainst += inn.runs;
      bowl.ballsAgainst += inn.legalBalls;
      bowl.wicketsTaken += inn.wickets;
    }

    if (match.status !== "completed") continue;
    a.matches += 1;
    b.matches += 1;
    const outcome = matchOutcome(match);
    if (outcome === "a") {
      a.won += 1;
      b.lost += 1;
    } else if (outcome === "b") {
      b.won += 1;
      a.lost += 1;
    } else if (outcome === "tie") {
      a.tied += 1;
      b.tied += 1;
    } else {
      a.nr += 1;
      b.nr += 1;
    }
  }

  return Array.from(map.values())
    .map((t) => {
      const rf = t.ballsFor > 0 ? t.runsFor / (t.ballsFor / 6) : 0;
      const ra = t.ballsAgainst > 0 ? t.runsAgainst / (t.ballsAgainst / 6) : 0;
      t.nrr = (rf - ra).toFixed(3);
      return t;
    })
    .sort((x, y) => y.won - x.won || Number(y.nrr) - Number(x.nrr) || x.name.localeCompare(y.name, "bn"));
}

export function toScheduleItem(match: Match): MatchScheduleItem {
  return {
    id: match.id,
    title: match.title,
    teamA: match.teamA,
    teamB: match.teamB,
    venue: match.venue,
    format: match.format,
    status: match.status,
    scheduledAt: match.scheduledAt,
  };
}

export function upcomingSchedule(matches: Match[], excludeId?: string): MatchScheduleItem[] {
  return matches
    .filter((m) => m.id !== excludeId && m.status === "upcoming")
    .sort((a, b) => {
      const ta = +new Date(a.scheduledAt || a.createdAt);
      const tb = +new Date(b.scheduledAt || b.createdAt);
      return ta - tb;
    })
    .map(toScheduleItem)
    .slice(0, 5);
}

export function batterAverage(runs: number, innings: number): string {
  if (innings <= 0) return "—";
  return (runs / innings).toFixed(1);
}

export function strikeRate(runs: number, balls: number): string {
  if (balls <= 0) return "—";
  return ((runs / balls) * 100).toFixed(1);
}

export function bowlEconomy(runs: number, balls: number): string {
  if (balls <= 0) return "—";
  return ((runs * 6) / balls).toFixed(2);
}
