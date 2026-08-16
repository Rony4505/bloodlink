import { emptyInnings, newId } from "./engine";
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
  const p1 = newId("p");
  const p2 = newId("p");
  const p3 = newId("p");
  const inn = emptyInnings("a");
  inn.strikerId = p1;
  inn.nonStrikerId = p2;
  inn.bowlerId = p3;
  inn.batters = [
    { playerId: p1, name: "রাফি আহমেদ", runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
    { playerId: p2, name: "সাকিব হাসান", runs: 0, balls: 0, fours: 0, sixes: 0, out: false },
  ];
  inn.bowlers = [
    { playerId: p3, name: "ইমরান খান", balls: 0, runs: 0, wickets: 0, maidens: 0, dotsInOver: 0 },
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
    players: [
      { id: p1, name: "রাফি আহমেদ", team: "a" },
      { id: p2, name: "সাকিব হাসান", team: "a" },
      { id: p3, name: "ইমরান খান", team: "b" },
      { id: newId("p"), name: "নাফিস ইকবাল", team: "a" },
      { id: newId("p"), name: "তানভীর ইসলাম", team: "b" },
    ],
    innings: [inn],
    currentInningsIndex: 0,
    events: [],
    commentary: [
      {
        id: newId("c"),
        text: "ম্যাচ শুরুর অপেক্ষায় — স্কোরার কনসোল থেকে আপডেট করুন",
        at: now,
      },
    ],
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
