import { newId } from "./id";
import type { BowlerStats, Innings, Match, Player, PlayerRole, TeamSide } from "./types";

type NamedRole = { name: string; role: PlayerRole };

const MIRPUR_XI: NamedRole[] = [
  { name: "রাফি আহমেদ", role: "batter" },
  { name: "সাকিব হাসান", role: "allrounder" },
  { name: "নাফিস ইকবাল", role: "batter" },
  { name: "তানভীর ইসলাম", role: "batter" },
  { name: "মাহমুদউল্লাহ", role: "allrounder" },
  { name: "লিটন দাস", role: "wk" },
  { name: "মেহেদী হাসান", role: "allrounder" },
  { name: "টাস্কিন আহমেদ", role: "bowler" },
  { name: "মুস্তাফিজুর রহমান", role: "bowler" },
  { name: "শাহীন আফ্রিদি", role: "bowler" },
  { name: "হাসান মাহমুদ", role: "bowler" },
];

const DHANMONDI_XI: NamedRole[] = [
  { name: "ইমরান খান", role: "bowler" },
  { name: "কাইসার রহমান", role: "batter" },
  { name: "আরিফ হোসেন", role: "allrounder" },
  { name: "নাজমুল হুদা", role: "batter" },
  { name: "ফাহাদ আহমেদ", role: "wk" },
  { name: "রিয়াদ হাসান", role: "batter" },
  { name: "সোহেল রানা", role: "allrounder" },
  { name: "জাবেদ আলী", role: "bowler" },
  { name: "রাফিউল ইসলাম", role: "bowler" },
  { name: "আকাশ চৌধুরী", role: "bowler" },
  { name: "নিশাত খান", role: "batter" },
];

function defaultRoleForIndex(i: number): PlayerRole {
  if (i <= 4) return "batter";
  if (i === 5) return "wk";
  if (i === 6) return "allrounder";
  return "bowler";
}

export function makeXi(names: string[], team: TeamSide, roles?: PlayerRole[]): Player[] {
  return names.slice(0, 11).map((name, i) => ({
    id: newId(`p${team}${i}`),
    name: name.trim() || `Player ${i + 1}`,
    team,
    role: roles?.[i] || defaultRoleForIndex(i),
    number: i + 1,
  }));
}

export function makeXiFromRoster(roster: NamedRole[], team: TeamSide): Player[] {
  return roster.slice(0, 11).map((r, i) => ({
    id: newId(`p${team}${i}`),
    name: r.name,
    team,
    role: r.role,
    number: i + 1,
  }));
}

export function defaultDemoPlayers(): Player[] {
  return [...makeXiFromRoster(MIRPUR_XI, "a"), ...makeXiFromRoster(DHANMONDI_XI, "b")];
}

export function normalizePlayer(p: Partial<Player> & { id: string; name: string; team: TeamSide }): Player {
  return {
    id: p.id,
    name: p.name,
    team: p.team,
    role: p.role || "batter",
    number: p.number,
  };
}

export function teamPlayers(match: Match, side: TeamSide): Player[] {
  const list = match.players.filter((p) => p.team === side).map((p) => normalizePlayer(p));
  if (list.length >= 11) return list.slice(0, 11);
  const padded = [...list];
  while (padded.length < 11) {
    padded.push({
      id: `pad_${side}_${padded.length}`,
      name: `প্লেয়ার ${padded.length + 1}`,
      team: side,
      role: defaultRoleForIndex(padded.length),
      number: padded.length + 1,
    });
  }
  return padded;
}

export type BattingRow = {
  playerId: string;
  name: string;
  role: PlayerRole;
  order: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  howOut?: string;
  status: "batting" | "out" | "yet";
  strikeRate: string;
};

export type BowlingRow = {
  playerId: string;
  name: string;
  role: PlayerRole;
  order: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  economy: string;
  figures: string;
  active: boolean;
  hasBowled: boolean;
  /** Listed as bowler/allrounder in XI, or part-time who actually bowled */
  listedBowler: boolean;
};

function sr(runs: number, balls: number): string {
  if (balls <= 0) return "—";
  return ((runs / balls) * 100).toFixed(1);
}

function figures(b: Pick<BowlerStats, "balls" | "maidens" | "runs" | "wickets">): string {
  return `${Math.floor(b.balls / 6)}.${b.balls % 6}-${b.maidens}-${b.runs}-${b.wickets}`;
}

export function isBowlingRole(role: PlayerRole): boolean {
  return role === "bowler" || role === "allrounder";
}

/** Full batting XI in scorecard order (faced first, then yet to bat). */
export function battingXiRows(match: Match, inn: Innings): BattingRow[] {
  const side = inn.battingTeam;
  const xi = teamPlayers(match, side);
  const roleById = new Map(xi.map((p) => [p.id, p.role]));
  const roleByName = new Map(xi.map((p) => [p.name.trim().toLowerCase(), p.role]));
  const byName = new Map(inn.batters.map((b) => [b.name.trim().toLowerCase(), b]));

  const used = new Set<string>();
  const faced: BattingRow[] = [];

  inn.batters.forEach((b, idx) => {
    used.add(b.playerId);
    const status: BattingRow["status"] = b.out
      ? "out"
      : b.playerId === inn.strikerId || b.playerId === inn.nonStrikerId || b.balls > 0 || b.runs > 0
        ? "batting"
        : "yet";
    faced.push({
      playerId: b.playerId,
      name: b.name,
      role: roleById.get(b.playerId) || roleByName.get(b.name.trim().toLowerCase()) || "batter",
      order: idx + 1,
      runs: b.runs,
      balls: b.balls,
      fours: b.fours,
      sixes: b.sixes,
      out: b.out,
      howOut: b.howOut,
      status: b.out ? "out" : status,
      strikeRate: sr(b.runs, b.balls),
    });
  });

  const yet: BattingRow[] = [];
  xi.forEach((p) => {
    if (used.has(p.id)) return;
    const viaName = byName.get(p.name.trim().toLowerCase());
    if (viaName && used.has(viaName.playerId)) return;
    if (viaName) {
      used.add(viaName.playerId);
      return;
    }
    yet.push({
      playerId: p.id,
      name: p.name,
      role: p.role,
      order: faced.length + yet.length + 1,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
      status: "yet",
      strikeRate: "—",
    });
  });

  const rows = [...faced, ...yet].slice(0, 11);
  while (rows.length < 11) {
    rows.push({
      playerId: `missing_${rows.length}`,
      name: `প্লেয়ার ${rows.length + 1}`,
      role: defaultRoleForIndex(rows.length),
      order: rows.length + 1,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
      status: "yet",
      strikeRate: "—",
    });
  }
  return rows;
}

/**
 * Bowling card:
 * - listed bowlers/allrounders from bowling XI
 * - PLUS anyone who actually bowled (e.g. batter part-time)
 * - exclude unused pure batters/WK
 */
export function bowlingXiRows(match: Match, inn: Innings): BowlingRow[] {
  const side: TeamSide = inn.battingTeam === "a" ? "b" : "a";
  const xi = teamPlayers(match, side);
  const byId = new Map(inn.bowlers.map((b) => [b.playerId, b]));
  const byName = new Map(inn.bowlers.map((b) => [b.name.trim().toLowerCase(), b]));

  const rows: BowlingRow[] = [];
  const used = new Set<string>();

  function pushFromPlayer(p: Player, stats?: BowlerStats) {
    if (used.has(p.id)) return;
    used.add(p.id);
    const hasBowled = Boolean(stats && (stats.balls > 0 || stats.runs > 0 || stats.wickets > 0));
    const listedBowler = isBowlingRole(p.role);
    if (!listedBowler && !hasBowled) return;

    rows.push({
      playerId: p.id,
      name: stats?.name || p.name,
      role: p.role,
      order: rows.length + 1,
      balls: stats?.balls || 0,
      runs: stats?.runs || 0,
      wickets: stats?.wickets || 0,
      maidens: stats?.maidens || 0,
      economy: stats?.balls ? ((stats.runs * 6) / stats.balls).toFixed(1) : "—",
      figures: stats ? figures(stats) : "0.0-0-0-0",
      active: stats?.playerId === inn.bowlerId,
      hasBowled,
      listedBowler,
    });
  }

  // First: designated bowlers/allrounders in XI order
  xi.forEach((p) => {
    if (!isBowlingRole(p.role)) return;
    const stats = byId.get(p.id) || byName.get(p.name.trim().toLowerCase());
    pushFromPlayer(p, stats);
  });

  // Then: anyone who bowled (batter part-time etc.)
  xi.forEach((p) => {
    const stats = byId.get(p.id) || byName.get(p.name.trim().toLowerCase());
    if (!stats) return;
    const hasBowled = stats.balls > 0 || stats.runs > 0 || stats.wickets > 0;
    if (!hasBowled) return;
    pushFromPlayer(p, stats);
  });

  inn.bowlers.forEach((b) => {
    if (used.has(b.playerId)) return;
    const hasBowled = b.balls > 0 || b.runs > 0 || b.wickets > 0;
    if (!hasBowled) return;
    const p = xi.find((x) => x.id === b.playerId) || {
      id: b.playerId,
      name: b.name,
      team: side,
      role: "batter" as PlayerRole,
    };
    pushFromPlayer(p, b);
  });

  return rows;
}

export function nextBatterFromXi(match: Match, inn: Innings): Player | undefined {
  const rows = battingXiRows(match, inn);
  return rows
    .filter((r) => r.status === "yet")
    .map((r) => teamPlayers(match, inn.battingTeam).find((p) => p.id === r.playerId) || {
      id: r.playerId,
      name: r.name,
      team: inn.battingTeam,
      role: r.role,
    })[0];
}

export function ensureMatchXi(match: Match): Match {
  const players = (match.players || []).map((p) => normalizePlayer(p as Player));
  const a = players.filter((p) => p.team === "a");
  const b = players.filter((p) => p.team === "b");
  if (a.length >= 11 && b.length >= 11) {
    return { ...match, players: [...a.slice(0, 11), ...b.slice(0, 11)] };
  }

  const nextPlayers = [
    ...(a.length >= 11 ? a.slice(0, 11) : makeXiFromRoster(MIRPUR_XI, "a")),
    ...(b.length >= 11 ? b.slice(0, 11) : makeXiFromRoster(DHANMONDI_XI, "b")),
  ];

  const next = { ...match, players: nextPlayers };
  const inn = next.innings[next.currentInningsIndex];
  if (inn) {
    const batSide = teamPlayers(next, inn.battingTeam);
    const bowlSide = teamPlayers(next, inn.battingTeam === "a" ? "b" : "a");
    if (!inn.strikerId && batSide[0]) inn.strikerId = batSide[0].id;
    if (!inn.nonStrikerId && batSide[1]) inn.nonStrikerId = batSide[1].id;
    if (!inn.bowlerId && bowlSide[0]) inn.bowlerId = bowlSide[0].id;

    if (inn.batters.length === 0 && batSide[0] && batSide[1]) {
      inn.batters = [
        { playerId: batSide[0].id, name: batSide[0].name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
        { playerId: batSide[1].id, name: batSide[1].name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
      ];
      inn.strikerId = batSide[0].id;
      inn.nonStrikerId = batSide[1].id;
    }
    if (inn.bowlers.length === 0 && bowlSide[0]) {
      const firstBowler = bowlSide.find((p) => isBowlingRole(p.role)) || bowlSide[0];
      inn.bowlers = [
        {
          playerId: firstBowler.id,
          name: firstBowler.name,
          balls: 0,
          runs: 0,
          wickets: 0,
          maidens: 0,
          dotsInOver: 0,
        },
      ];
      inn.bowlerId = firstBowler.id;
    }
  }
  return next;
}
