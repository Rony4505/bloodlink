export type MatchFormat = "T20" | "ODI" | "Test" | "Custom";
export type MatchStatus = "upcoming" | "live" | "completed";
export type TeamSide = "a" | "b";
export type RentalPlan = "daily" | "weekly" | "monthly" | "event";

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
};
