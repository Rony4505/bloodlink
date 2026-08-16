import type {
  BallType,
  BatterStats,
  BowlerStats,
  Innings,
  Match,
  MatchFormat,
  TeamSide,
} from "./types";

export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ballsPerInnings(format: MatchFormat, customOvers = 20): number {
  if (format === "T20") return 120;
  if (format === "ODI") return 300;
  if (format === "Test") return 9999;
  return Math.max(6, customOvers) * 6;
}

export function emptyInnings(battingTeam: TeamSide): Innings {
  return {
    battingTeam,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    extras: { wd: 0, nb: 0, b: 0, lb: 0 },
    batters: [],
    bowlers: [],
    recentBalls: [],
    oversLog: [],
    currentOverBalls: [],
    completed: false,
  };
}

export function oversFromBalls(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function ensureBatter(innings: Innings, playerId: string, name: string): BatterStats {
  let batter = innings.batters.find((b) => b.playerId === playerId);
  if (!batter) {
    batter = { playerId, name, runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
    innings.batters.push(batter);
  }
  return batter;
}

export function ensureBowler(innings: Innings, playerId: string, name: string): BowlerStats {
  let bowler = innings.bowlers.find((b) => b.playerId === playerId);
  if (!bowler) {
    bowler = {
      playerId,
      name,
      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,
      dotsInOver: 0,
    };
    innings.bowlers.push(bowler);
  }
  return bowler;
}

function cloneInnings(innings: Innings): Innings {
  return JSON.parse(JSON.stringify(innings)) as Innings;
}

function finishOverIfNeeded(innings: Innings) {
  if (innings.legalBalls > 0 && innings.legalBalls % 6 === 0 && innings.currentOverBalls.length > 0) {
    innings.oversLog.push(innings.currentOverBalls.join(" "));
    const bowler = innings.bowlers.find((b) => b.playerId === innings.bowlerId);
    if (bowler && bowler.dotsInOver === 6) {
      bowler.maidens += 1;
    }
    if (bowler) bowler.dotsInOver = 0;
    innings.currentOverBalls = [];
    // swap strike at end of over
    const s = innings.strikerId;
    innings.strikerId = innings.nonStrikerId;
    innings.nonStrikerId = s;
  }
}

export type ScoreInput = {
  type: BallType;
  runs: number;
  isWicket?: boolean;
  note?: string;
  strikerName?: string;
  nonStrikerName?: string;
  bowlerName?: string;
};

export function applyBall(match: Match, input: ScoreInput): Match {
  const innings = match.innings[match.currentInningsIndex];
  if (!innings || innings.completed || match.status === "completed") {
    return match;
  }

  const next = structuredClone(match) as Match;
  const inn = next.innings[next.currentInningsIndex];
  const before = cloneInnings(inn);

  if (input.strikerName && inn.strikerId) {
    const b = ensureBatter(inn, inn.strikerId, input.strikerName);
    b.name = input.strikerName;
  }
  if (input.nonStrikerName && inn.nonStrikerId) {
    const b = ensureBatter(inn, inn.nonStrikerId, input.nonStrikerName);
    b.name = input.nonStrikerName;
  }
  if (input.bowlerName && inn.bowlerId) {
    const b = ensureBowler(inn, inn.bowlerId, input.bowlerName);
    b.name = input.bowlerName;
  }

  const strikerId = inn.strikerId || newId("bat");
  const nonStrikerId = inn.nonStrikerId || newId("bat");
  const bowlerId = inn.bowlerId || newId("bowl");

  if (!inn.strikerId) inn.strikerId = strikerId;
  if (!inn.nonStrikerId) inn.nonStrikerId = nonStrikerId;
  if (!inn.bowlerId) inn.bowlerId = bowlerId;

  const striker = ensureBatter(inn, inn.strikerId, input.strikerName || "Batsman 1");
  ensureBatter(inn, inn.nonStrikerId, input.nonStrikerName || "Batsman 2");
  const bowler = ensureBowler(inn, inn.bowlerId, input.bowlerName || "Bowler");

  const runs = Math.max(0, Math.floor(input.runs));
  let label = "";
  let legal = false;

  if (input.type === "wide") {
    inn.runs += 1 + runs;
    inn.extras.wd += 1 + runs;
    bowler.runs += 1 + runs;
    label = runs > 0 ? `WD+${runs}` : "WD";
    inn.currentOverBalls.push(label);
  } else if (input.type === "noball") {
    inn.runs += 1 + runs;
    inn.extras.nb += 1;
    bowler.runs += 1 + runs;
    if (runs > 0 && !input.isWicket) {
      striker.runs += runs;
      if (runs === 4) striker.fours += 1;
      if (runs === 6) striker.sixes += 1;
    }
    label = runs > 0 ? `NB+${runs}` : "NB";
    inn.currentOverBalls.push(label);
  } else if (input.type === "bye") {
    inn.runs += runs;
    inn.extras.b += runs;
    legal = true;
    label = runs > 0 ? `B${runs}` : "B0";
  } else if (input.type === "legbye") {
    inn.runs += runs;
    inn.extras.lb += runs;
    legal = true;
    label = runs > 0 ? `LB${runs}` : "LB0";
  } else if (input.type === "wicket" || input.isWicket) {
    legal = true;
    inn.wickets += 1;
    striker.out = true;
    striker.howOut = input.note || "out";
    striker.balls += 1;
    bowler.wickets += 1;
    bowler.balls += 1;
    if (runs > 0) {
      inn.runs += runs;
      // rare cases like runout with runs — attribute to team only
    }
    label = "W";
  } else {
    // normal run
    legal = true;
    inn.runs += runs;
    striker.runs += runs;
    striker.balls += 1;
    bowler.runs += runs;
    bowler.balls += 1;
    if (runs === 0) bowler.dotsInOver += 1;
    if (runs === 4) striker.fours += 1;
    if (runs === 6) striker.sixes += 1;
    label = String(runs);
  }

  if (legal && input.type !== "wicket" && !input.isWicket) {
    if (input.type === "bye" || input.type === "legbye") {
      striker.balls += 1;
      bowler.balls += 1;
      if (runs === 0) bowler.dotsInOver += 1;
    }
    inn.legalBalls += 1;
    inn.currentOverBalls.push(label);
  } else if (input.type === "wicket" || input.isWicket) {
    inn.legalBalls += 1;
    inn.currentOverBalls.push(label);
  }

  inn.recentBalls = [...inn.currentOverBalls.slice(-12), ...inn.recentBalls.filter(() => false)];
  // keep recent as last balls across overs for UI
  const flat = [...inn.oversLog.flatMap((o) => o.split(" ")), ...inn.currentOverBalls];
  inn.recentBalls = flat.slice(-18);

  // rotate strike on odd runs (for legal scoring deliveries that count to batter or byes)
  if (
    (input.type === "run" || input.type === "bye" || input.type === "legbye" || input.type === "noball") &&
    runs % 2 === 1 &&
    !input.isWicket
  ) {
    const s = inn.strikerId;
    inn.strikerId = inn.nonStrikerId;
    inn.nonStrikerId = s;
  }

  if (legal) finishOverIfNeeded(inn);

  const maxBalls = ballsPerInnings(next.format);
  if (inn.wickets >= 10 || inn.legalBalls >= maxBalls) {
    inn.completed = true;
  }

  if (next.target && inn.runs >= next.target) {
    inn.completed = true;
    next.status = "completed";
  }

  next.events.push({
    id: newId("ev"),
    inningsIndex: next.currentInningsIndex,
    type: input.type,
    runs,
    isWicket: Boolean(input.isWicket || input.type === "wicket"),
    label,
    note: input.note,
    at: new Date().toISOString(),
    snapshot: before,
  });

  if (input.note) {
    next.commentary.unshift({
      id: newId("c"),
      text: input.note,
      at: new Date().toISOString(),
    });
  } else {
    next.commentary.unshift({
      id: newId("c"),
      text: `${label} — ${oversFromBalls(inn.legalBalls)} overs, ${inn.runs}/${inn.wickets}`,
      at: new Date().toISOString(),
    });
  }

  next.commentary = next.commentary.slice(0, 80);
  next.status = next.status === "upcoming" ? "live" : next.status;
  next.updatedAt = new Date().toISOString();
  return next;
}

export function undoLastBall(match: Match): Match {
  if (match.events.length === 0) return match;
  const next = structuredClone(match) as Match;
  const last = next.events.pop();
  if (!last) return match;
  next.innings[last.inningsIndex] = last.snapshot;
  next.currentInningsIndex = last.inningsIndex;
  next.commentary.shift();
  next.updatedAt = new Date().toISOString();
  if (next.events.length === 0 && next.status === "live") {
    next.status = "upcoming";
  }
  return next;
}

export function startSecondInnings(match: Match): Match {
  const next = structuredClone(match) as Match;
  const first = next.innings[0];
  if (!first) return match;
  first.completed = true;
  const battingTeam: TeamSide = first.battingTeam === "a" ? "b" : "a";
  next.innings.push(emptyInnings(battingTeam));
  next.currentInningsIndex = next.innings.length - 1;
  next.target = first.runs + 1;
  next.status = "live";
  next.updatedAt = new Date().toISOString();
  next.commentary.unshift({
    id: newId("c"),
    text: `দ্বিতীয় ইনিংস শুরু — টার্গেট ${next.target}`,
    at: new Date().toISOString(),
  });
  return next;
}

export function setPlayersOnStrike(
  match: Match,
  opts: { strikerId?: string; nonStrikerId?: string; bowlerId?: string; strikerName?: string; nonStrikerName?: string; bowlerName?: string },
): Match {
  const next = structuredClone(match) as Match;
  const inn = next.innings[next.currentInningsIndex];
  if (!inn) return match;

  if (opts.strikerId) inn.strikerId = opts.strikerId;
  if (opts.nonStrikerId) inn.nonStrikerId = opts.nonStrikerId;
  if (opts.bowlerId) inn.bowlerId = opts.bowlerId;

  if (inn.strikerId && opts.strikerName) ensureBatter(inn, inn.strikerId, opts.strikerName).name = opts.strikerName;
  if (inn.nonStrikerId && opts.nonStrikerName) {
    ensureBatter(inn, inn.nonStrikerId, opts.nonStrikerName).name = opts.nonStrikerName;
  }
  if (inn.bowlerId && opts.bowlerName) ensureBowler(inn, inn.bowlerId, opts.bowlerName).name = opts.bowlerName;

  next.updatedAt = new Date().toISOString();
  return next;
}

export function youtubeEmbedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
      const parts = u.pathname.split("/");
      const liveIdx = parts.indexOf("live");
      if (liveIdx >= 0 && parts[liveIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[liveIdx + 1]}?autoplay=1`;
      }
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}?autoplay=1`;
      }
    }
    if (u.hostname.includes("facebook.com") || u.hostname.includes("fb.watch")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
    }
  } catch {
    return null;
  }
  return null;
}
