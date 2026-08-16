import type { Match, PlayerRecord, PlayerRole } from "./types";

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

  return Array.from(map.values()).sort((a, b) => b.runs - a.runs || b.wickets - a.wickets);
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
