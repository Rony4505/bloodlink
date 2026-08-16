import { newId } from "./engine";
import type { BatterStats, BowlerStats, Innings, Match, Player, TeamSide } from "./types";

const MIRPUR_XI = [
  "রাফি আহমেদ",
  "সাকিব হাসান",
  "নাফিস ইকবাল",
  "তানভীর ইসলাম",
  "মাহমুদউল্লাহ",
  "লিটন দাস",
  "মেহেদী হাসান",
  "টাস্কিন আহমেদ",
  "মুস্তাফিজুর রহমান",
  "শাহীন আফ্রিদি",
  "হাসান মাহমুদ",
];

const DHANMONDI_XI = [
  "ইমরান খান",
  "কাইসার রহমান",
  "আরিফ হোসেন",
  "নাজমুল হুদা",
  "ফাহাদ আহমেদ",
  "রিয়াদ হাসান",
  "সোহেল রানা",
  "জাবেদ আলী",
  "রাফিউল ইসলাম",
  "আকাশ চৌধুরী",
  "নিশাত খান",
];

export function makeXi(names: string[], team: TeamSide): Player[] {
  return names.slice(0, 11).map((name, i) => ({
    id: newId(`p${team}${i}`),
    name: name.trim() || `Player ${i + 1}`,
    team,
  }));
}

export function defaultDemoPlayers(): Player[] {
  return [...makeXi(MIRPUR_XI, "a"), ...makeXi(DHANMONDI_XI, "b")];
}

export function teamPlayers(match: Match, side: TeamSide): Player[] {
  const list = match.players.filter((p) => p.team === side);
  if (list.length >= 11) return list.slice(0, 11);
  // pad to 11 for display
  const padded = [...list];
  while (padded.length < 11) {
    padded.push({
      id: `pad_${side}_${padded.length}`,
      name: `প্লেয়ার ${padded.length + 1}`,
      team: side,
    });
  }
  return padded;
}

export type BattingRow = {
  playerId: string;
  name: string;
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
  order: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  economy: string;
  figures: string;
  active: boolean;
  hasBowled: boolean;
};

function sr(runs: number, balls: number): string {
  if (balls <= 0) return "—";
  return ((runs / balls) * 100).toFixed(1);
}

function figures(b: Pick<BowlerStats, "balls" | "maidens" | "runs" | "wickets">): string {
  return `${Math.floor(b.balls / 6)}.${b.balls % 6}-${b.maidens}-${b.runs}-${b.wickets}`;
}

/** Full batting XI in scorecard order (faced first, then yet to bat). */
export function battingXiRows(match: Match, inn: Innings): BattingRow[] {
  const side = inn.battingTeam;
  const xi = teamPlayers(match, side);
  const byId = new Map(inn.batters.map((b) => [b.playerId, b]));
  const byName = new Map(inn.batters.map((b) => [b.name.trim().toLowerCase(), b]));

  const used = new Set<string>();
  const faced: BattingRow[] = [];

  // Keep innings batting order for those who have faced
  inn.batters.forEach((b, idx) => {
    used.add(b.playerId);
    const status: BattingRow["status"] =
      !b.out && (b.playerId === inn.strikerId || b.playerId === inn.nonStrikerId)
        ? "batting"
        : b.out
          ? "out"
          : b.balls > 0 || b.runs > 0
            ? "batting"
            : "yet";
    faced.push({
      playerId: b.playerId,
      name: b.name,
      order: idx + 1,
      runs: b.runs,
      balls: b.balls,
      fours: b.fours,
      sixes: b.sixes,
      out: b.out,
      howOut: b.howOut,
      status: b.out ? "out" : status === "yet" && (b.playerId === inn.strikerId || b.playerId === inn.nonStrikerId) ? "batting" : status,
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
  // If still short (no XI saved), pad
  while (rows.length < 11) {
    rows.push({
      playerId: `missing_${rows.length}`,
      name: `প্লেয়ার ${rows.length + 1}`,
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

/** Full bowling-side XI with figures (unused bowlers show 0.0-0-0-0). */
export function bowlingXiRows(match: Match, inn: Innings): BowlingRow[] {
  const side: TeamSide = inn.battingTeam === "a" ? "b" : "a";
  const xi = teamPlayers(match, side);
  const byId = new Map(inn.bowlers.map((b) => [b.playerId, b]));
  const byName = new Map(inn.bowlers.map((b) => [b.name.trim().toLowerCase(), b]));

  const rows: BowlingRow[] = xi.map((p, idx) => {
    const stats = byId.get(p.id) || byName.get(p.name.trim().toLowerCase());
    if (stats) {
      return {
        playerId: p.id,
        name: stats.name || p.name,
        order: idx + 1,
        balls: stats.balls,
        runs: stats.runs,
        wickets: stats.wickets,
        maidens: stats.maidens,
        economy: stats.balls ? ((stats.runs * 6) / stats.balls).toFixed(1) : "—",
        figures: figures(stats),
        active: stats.playerId === inn.bowlerId,
        hasBowled: stats.balls > 0 || stats.runs > 0 || stats.wickets > 0,
      };
    }
    return {
      playerId: p.id,
      name: p.name,
      order: idx + 1,
      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,
      economy: "—",
      figures: "0.0-0-0-0",
      active: false,
      hasBowled: false,
    };
  });

  // Include any bowlers in innings not in XI list
  inn.bowlers.forEach((b) => {
    if (rows.some((r) => r.playerId === b.playerId || r.name === b.name)) return;
    rows.push({
      playerId: b.playerId,
      name: b.name,
      order: rows.length + 1,
      balls: b.balls,
      runs: b.runs,
      wickets: b.wickets,
      maidens: b.maidens,
      economy: b.balls ? ((b.runs * 6) / b.balls).toFixed(1) : "—",
      figures: figures(b),
      active: b.playerId === inn.bowlerId,
      hasBowled: true,
    });
  });

  return rows.slice(0, 11);
}

export function ensureMatchXi(match: Match): Match {
  const a = match.players.filter((p) => p.team === "a");
  const b = match.players.filter((p) => p.team === "b");
  if (a.length >= 11 && b.length >= 11) return match;

  const players = [...(a.length >= 11 ? a.slice(0, 11) : makeXi(MIRPUR_XI, "a")), ...(b.length >= 11 ? b.slice(0, 11) : makeXi(DHANMONDI_XI, "b"))];

  // Re-link openers/bowler ids if demo placeholders
  const next = { ...match, players };
  const inn = next.innings[next.currentInningsIndex];
  if (inn) {
    const batSide = teamPlayers(next, inn.battingTeam);
    const bowlSide = teamPlayers(next, inn.battingTeam === "a" ? "b" : "a");
    if (!inn.strikerId && batSide[0]) inn.strikerId = batSide[0].id;
    if (!inn.nonStrikerId && batSide[1]) inn.nonStrikerId = batSide[1].id;
    if (!inn.bowlerId && bowlSide[0]) inn.bowlerId = bowlSide[0].id;

    // Sync batter names from XI when empty/default
    if (inn.batters.length === 0 && batSide[0] && batSide[1]) {
      inn.batters = [
        { playerId: batSide[0].id, name: batSide[0].name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
        { playerId: batSide[1].id, name: batSide[1].name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
      ];
      inn.strikerId = batSide[0].id;
      inn.nonStrikerId = batSide[1].id;
    }
    if (inn.bowlers.length === 0 && bowlSide[0]) {
      inn.bowlers = [
        {
          playerId: bowlSide[0].id,
          name: bowlSide[0].name,
          balls: 0,
          runs: 0,
          wickets: 0,
          maidens: 0,
          dotsInOver: 0,
        },
      ];
      inn.bowlerId = bowlSide[0].id;
    }
  }
  return next;
}
