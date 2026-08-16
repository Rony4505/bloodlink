import { emptyInnings } from "./engine";
import { defaultDemoPlayers, teamPlayers } from "./lineup";
import type { CricketStore, Match, Tenant } from "./types";

export const DEFAULT_OWNER_PIN = "4505";

export function demoTenant(): Tenant {
  const now = Date.now();
  return {
    id: "tenant_demo",
    slug: "demo",
    name: "ডেমো ক্লাব ক্রিকেট",
    contactPhone: "01700000000",
    pin: "1234",
    plan: "monthly",
    expiresAt: new Date(now + 1000 * 60 * 60 * 24 * 90).toISOString(),
    active: true,
    brandColor: "#0B6E4F",
    createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
  };
}

export function demoMatch(tenantId: string): Match {
  const now = new Date().toISOString();
  const players = defaultDemoPlayers();
  const teamA = players.filter((p) => p.team === "a");
  const teamB = players.filter((p) => p.team === "b");
  const inn = emptyInnings("a");
  inn.strikerId = teamA[0]?.id;
  inn.nonStrikerId = teamA[1]?.id;
  inn.bowlerId = teamB[0]?.id;
  inn.batters = [
    {
      playerId: teamA[0].id,
      name: teamA[0].name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
    },
    {
      playerId: teamA[1].id,
      name: teamA[1].name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
    },
  ];
  inn.bowlers = [
    {
      playerId: teamB[0].id,
      name: teamB[0].name,
      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,
      dotsInOver: 0,
    },
  ];

  return {
    id: "match_demo_live",
    tenantId,
    title: "ফ্রেন্ডশিপ কাপ — ফাইনাল",
    format: "T20",
    status: "upcoming",
    venue: "মিরপুর অ্যামেচার গ্রাউন্ড",
    videoUrl: "",
    teamA: { name: "মিরপুর একাদশ", short: "MIR" },
    teamB: { name: "ধানমন্ডি XI", short: "DHN" },
    players,
    innings: [inn],
    currentInningsIndex: 0,
    events: [],
    commentary: [
      {
        id: "c_demo_start",
        text: "ম্যাচ শুরুর অপেক্ষায় — স্কোরার কনসোল থেকে আপডেট করুন",
        at: now,
      },
    ],
    graphic: { kind: "hidden", updatedAt: now },
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyStore(): CricketStore {
  const tenant = demoTenant();
  return {
    settings: {
      ownerPin: DEFAULT_OWNER_PIN,
      siteName: "PitchLive",
      tagline: "ম্যাচ চলাকালীন লাইভ স্কোর + ভিডিও — রেন্ট করে চালান",
      contactPhone: "01XXXXXXXXX",
    },
    tenants: [tenant],
    matches: [demoMatch(tenant.id)],
  };
}

export { teamPlayers };
