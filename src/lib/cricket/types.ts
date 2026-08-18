export type MatchFormat = "T20" | "ODI" | "Test" | "Custom";
export type MatchStatus = "upcoming" | "live" | "completed";
export type TeamSide = "a" | "b";
export type RentalPlan = "daily" | "weekly" | "monthly" | "event";
export type PlayerRole = "batter" | "bowler" | "allrounder" | "wk";

export type BallType = "run" | "wicket" | "wide" | "noball" | "bye" | "legbye";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  contactPhone: string;
  pin: string;
  plan: RentalPlan;
  expiresAt: string;
  active: boolean;
  brandColor: string;
  createdAt: string;
};

export type Player = {
  id: string;
  name: string;
  team: TeamSide;
  role: PlayerRole;
  /** jersey / squad no (optional) */
  number?: number;
};

export type BatterStats = {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  howOut?: string;
};

export type BowlerStats = {
  playerId: string;
  name: string;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  dotsInOver: number;
};

export type Innings = {
  battingTeam: TeamSide;
  runs: number;
  wickets: number;
  legalBalls: number;
  extras: { wd: number; nb: number; b: number; lb: number };
  batters: BatterStats[];
  bowlers: BowlerStats[];
  strikerId?: string;
  nonStrikerId?: string;
  bowlerId?: string;
  recentBalls: string[];
  oversLog: string[];
  currentOverBalls: string[];
  completed: boolean;
  /** Next delivery is a free hit (after a no-ball in limited overs). */
  freeHit?: boolean;
};

export type BallEvent = {
  id: string;
  inningsIndex: number;
  type: BallType;
  runs: number;
  isWicket: boolean;
  label: string;
  note?: string;
  at: string;
  snapshot: Innings;
};

/** On-stream graphics like international TV broadcasts */
export type GraphicKind =
  | "hidden"
  | "batter"
  | "bowler"
  | "partnership"
  | "batting"
  | "bowling"
  | "teams"
  | "player"
  | "player_teams"
  | "schedule";

export type BroadcastGraphic = {
  kind: GraphicKind;
  /** For kind=player / player_teams — show this player's full performance */
  playerId?: string;
  updatedAt: string;
};

export type MatchScheduleItem = {
  id: string;
  title: string;
  teamA: { name: string; short: string };
  teamB: { name: string; short: string };
  venue: string;
  format: MatchFormat;
  status: MatchStatus;
  scheduledAt?: string;
};

export type PlayerTeamSplitRow = {
  teamName: string;
  teamShort: string;
  matches: number;
  runs: number;
  balls: number;
  wickets: number;
  bowlBalls: number;
  bowlRuns: number;
};

export type PlayerTeamReport = {
  key: string;
  name: string;
  role: PlayerRole;
  vs: PlayerTeamSplitRow[];
  forTeams: PlayerTeamSplitRow[];
};

export type TeamStanding = {
  name: string;
  short: string;
  matches: number;
  won: number;
  lost: number;
  tied: number;
  nr: number;
  runsFor: number;
  ballsFor: number;
  runsAgainst: number;
  ballsAgainst: number;
  wicketsTaken: number;
  wicketsLost: number;
  nrr: string;
};

/** Lifetime / cumulative stats across matches for a tenant */
export type PlayerRecord = {
  id: string;
  name: string;
  role: PlayerRole;
  matches: number;
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  bowlBalls: number;
  bowlRuns: number;
  maidens: number;
  updatedAt: string;
};

export type Match = {
  id: string;
  tenantId: string;
  title: string;
  format: MatchFormat;
  status: MatchStatus;
  venue: string;
  videoUrl: string;
  teamA: { name: string; short: string };
  teamB: { name: string; short: string };
  players: Player[];
  innings: Innings[];
  currentInningsIndex: number;
  target?: number;
  events: BallEvent[];
  commentary: { id: string; text: string; at: string }[];
  graphic?: BroadcastGraphic;
  /** Kickoff time for upcoming matches (ISO). Used on stream schedule graphic. */
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PlatformSettings = {
  ownerPin: string;
  siteName: string;
  tagline: string;
  contactPhone: string;
};

export type CricketStore = {
  settings: PlatformSettings;
  tenants: Tenant[];
  matches: Match[];
  /** Cumulative player performance by tenantId */
  playerRecords: Record<string, PlayerRecord[]>;
};
