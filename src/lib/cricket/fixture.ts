import { emptyInnings, newId } from "./engine";
import { makeXi } from "./lineup";
import type { Match, MatchFormat, TeamSide } from "./types";

export function defaultTeamShort(name: string, fallback: string): string {
  const cleaned = name.trim();
  if (!cleaned) return fallback;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
  }
  return cleaned.slice(0, 5).toUpperCase();
}

/** True when fixture fields can still be changed (no ball scored yet). */
export function isFixtureEditable(match: Match): boolean {
  if (match.status === "completed") return false;
  const balls = match.innings.reduce((n, inn) => n + inn.legalBalls, 0);
  const events = match.events?.length || 0;
  return balls === 0 && events === 0;
}

export type FixtureInput = {
  title?: string;
  format?: MatchFormat;
  venue?: string;
  videoUrl?: string;
  teamAName?: string;
  teamAShort?: string;
  teamBName?: string;
  teamBShort?: string;
  battingFirst?: TeamSide;
  scheduledAt?: string;
};

function buildInnings(players: ReturnType<typeof makeXi>, battingFirst: TeamSide) {
  const batSide = players.filter((p) => p.team === battingFirst);
  const bowlSide = players.filter((p) => p.team !== battingFirst);
  const inn = emptyInnings(battingFirst);
  if (batSide[0] && batSide[1] && bowlSide[0]) {
    inn.strikerId = batSide[0].id;
    inn.nonStrikerId = batSide[1].id;
    inn.bowlerId = bowlSide[0].id;
    inn.batters = [
      { playerId: batSide[0].id, name: batSide[0].name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
      { playerId: batSide[1].id, name: batSide[1].name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
    ];
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
  }
  return inn;
}

export function buildNewMatch(tenantId: string, input: FixtureInput): Match {
  const battingFirst = input.battingFirst === "b" ? "b" : "a";
  const teamAName = (input.teamAName || "টিম A").trim();
  const teamBName = (input.teamBName || "টিম B").trim();
  const players = [
    ...makeXi(Array.from({ length: 11 }, (_, i) => `${teamAName} #${i + 1}`), "a"),
    ...makeXi(Array.from({ length: 11 }, (_, i) => `${teamBName} #${i + 1}`), "b"),
  ];
  const now = new Date().toISOString();

  return {
    id: newId("match"),
    tenantId,
    title: (input.title || `${teamAName} vs ${teamBName}`).trim(),
    format: input.format || "T20",
    status: "upcoming",
    venue: (input.venue || "").trim(),
    videoUrl: (input.videoUrl || "").trim(),
    teamA: {
      name: teamAName,
      short: (input.teamAShort || defaultTeamShort(teamAName, "TEA")).trim().slice(0, 5).toUpperCase(),
    },
    teamB: {
      name: teamBName,
      short: (input.teamBShort || defaultTeamShort(teamBName, "TEB")).trim().slice(0, 5).toUpperCase(),
    },
    players,
    innings: [buildInnings(players, battingFirst)],
    currentInningsIndex: 0,
    events: [],
    commentary: [{ id: newId("c"), text: "ম্যাচ তৈরি হয়েছে — স্কোর আপডেট শুরু করুন", at: now }],
    graphic: { kind: "hidden", updatedAt: now },
    scheduledAt: (input.scheduledAt || "").trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyFixtureUpdate(match: Match, input: FixtureInput): Match {
  if (!isFixtureEditable(match)) {
    throw new Error("এই ম্যাচের fixture আর এডিট করা যাবে না — স্কোরিং শুরু হয়েছে");
  }

  const next = structuredClone(match) as Match;
  const teamAName = (input.teamAName ?? next.teamA.name).trim();
  const teamBName = (input.teamBName ?? next.teamB.name).trim();

  if (input.title !== undefined) next.title = input.title.trim() || next.title;
  if (input.format) next.format = input.format;
  if (input.venue !== undefined) next.venue = input.venue.trim();
  if (input.videoUrl !== undefined) next.videoUrl = input.videoUrl.trim();
  if (input.scheduledAt !== undefined) next.scheduledAt = input.scheduledAt.trim() || undefined;

  next.teamA = {
    name: teamAName,
    short: (input.teamAShort ?? next.teamA.short).trim().slice(0, 5).toUpperCase(),
  };
  next.teamB = {
    name: teamBName,
    short: (input.teamBShort ?? next.teamB.short).trim().slice(0, 5).toUpperCase(),
  };

  if (input.battingFirst && input.battingFirst !== next.innings[0]?.battingTeam) {
    next.innings = [buildInnings(next.players, input.battingFirst)];
    next.currentInningsIndex = 0;
    next.target = undefined;
  }

  next.updatedAt = new Date().toISOString();
  return next;
}
