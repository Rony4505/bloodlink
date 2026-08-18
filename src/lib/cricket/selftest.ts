import { applyBall, emptyInnings, undoLastBall } from "./engine";
import { buildPlayerTeamReports, buildTeamStandings, matchOutcome } from "./stats";
import type { Match, Player } from "./types";

function miniMatch(overrides: Partial<Match> = {}): Match {
  const players: Player[] = [
    { id: "a1", name: "Ali", team: "a", role: "batter" },
    { id: "a2", name: "Babu", team: "a", role: "batter" },
    { id: "b1", name: "Chotu", team: "b", role: "bowler" },
    { id: "b2", name: "Deep", team: "b", role: "allrounder" },
  ];
  const inn = emptyInnings("a");
  inn.strikerId = "a1";
  inn.nonStrikerId = "a2";
  inn.bowlerId = "b1";
  const now = new Date().toISOString();
  return {
    id: "m1",
    tenantId: "t1",
    title: "Test",
    format: "T20",
    status: "live",
    venue: "Dhaka",
    videoUrl: "",
    teamA: { name: "Mirpur", short: "MIR" },
    teamB: { name: "Dhanmondi", short: "DHN" },
    players,
    innings: [inn],
    currentInningsIndex: 0,
    events: [],
    commentary: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

let m = miniMatch();
m = applyBall(m, { type: "noball", runs: 0 });
assert(m.innings[0].freeHit === true, "no-ball should set free hit");
assert(m.innings[0].runs === 1, "no-ball adds 1 run");

m = applyBall(m, { type: "wide", runs: 0 });
assert(m.innings[0].freeHit === true, "wide on free hit keeps free hit");

m = applyBall(m, { type: "run", runs: 1 });
assert(m.innings[0].freeHit === false, "legal ball consumes free hit");

m = applyBall(m, { type: "noball", runs: 4 });
assert(m.innings[0].freeHit === true, "another no-ball restores free hit");
m = undoLastBall(m);
assert(m.innings[0].freeHit === false, "undo restores previous free-hit state");

let testFmt = miniMatch({ format: "Test" });
testFmt = applyBall(testFmt, { type: "noball", runs: 0 });
assert(testFmt.innings[0].freeHit !== true, "Test cricket has no free hit");

const completed: Match = miniMatch({
  status: "completed",
  innings: [
    { ...emptyInnings("a"), runs: 150, wickets: 6, legalBalls: 120, completed: true },
    { ...emptyInnings("b"), runs: 140, wickets: 8, legalBalls: 120, completed: true },
  ],
});
completed.innings[0].batters = [{ playerId: "a1", name: "Ali", runs: 80, balls: 50, fours: 8, sixes: 2, out: true }];
completed.innings[1].bowlers = [{ playerId: "a1", name: "Ali", balls: 24, runs: 30, wickets: 2, maidens: 0, dotsInOver: 0 }];
assert(matchOutcome(completed) === "a", "higher first-innings score wins if chase fails");

const table = buildTeamStandings([completed]);
const mir = table.find((t) => t.short === "MIR");
const dhn = table.find((t) => t.short === "DHN");
assert(mir?.won === 1 && dhn?.lost === 1, "team table win/loss");

const splits = buildPlayerTeamReports([completed]);
const ali = splits.find((p) => p.name === "Ali");
assert(ali, "player team report exists");
assert(ali!.vs.some((r) => r.teamShort === "DHN" && r.runs === 80), "Ali vs Dhanmondi runs");
assert(ali!.vs.some((r) => r.teamShort === "DHN" && r.wickets === 2), "Ali vs Dhanmondi wickets");

console.log("cricket selftest ok");
