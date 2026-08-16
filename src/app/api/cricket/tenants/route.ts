import { emptyInnings, newId } from "@/lib/cricket/engine";
import { tenantAccessOk } from "@/lib/cricket/format";
import { fail, ok, slugify } from "@/lib/cricket/http";
import { makeXi } from "@/lib/cricket/lineup";
import {
  findTenantBySlug,
  matchesForTenant,
  readCricketStore,
  updateCricketStore,
} from "@/lib/cricket/store";
import type { Match, MatchFormat, RentalPlan, Tenant } from "@/lib/cricket/types";

export const runtime = "nodejs";

function publicTenant(t: Tenant) {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    brandColor: t.brandColor,
    plan: t.plan,
    expiresAt: t.expiresAt,
    active: t.active,
    contactPhone: t.contactPhone,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  if (!slug) return fail("slug required");

  const store = await readCricketStore();
  const tenant = findTenantBySlug(store, slug);
  if (!tenant) return fail("ক্লাব পাওয়া যায়নি", 404);
  if (!tenantAccessOk(tenant)) return fail("রেন্ট মেয়াদ শেষ বা নিষ্ক্রিয়", 403);

  const matches = matchesForTenant(store, tenant.id).map((m) => ({
    id: m.id,
    title: m.title,
    format: m.format,
    status: m.status,
    venue: m.venue,
    teamA: m.teamA,
    teamB: m.teamB,
    updatedAt: m.updatedAt,
    innings: m.innings.map((inn) => ({
      battingTeam: inn.battingTeam,
      runs: inn.runs,
      wickets: inn.wickets,
      legalBalls: inn.legalBalls,
      completed: inn.completed,
    })),
    currentInningsIndex: m.currentInningsIndex,
    target: m.target,
  }));

  return ok({ tenant: publicTenant(tenant), matches });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: string;
    ownerPin?: string;
    tenantPin?: string;
    slug?: string;
    name?: string;
    contactPhone?: string;
    pin?: string;
    plan?: RentalPlan;
    days?: number;
    brandColor?: string;
    active?: boolean;
    tenantId?: string;
    // match create
    title?: string;
    format?: MatchFormat;
    venue?: string;
    videoUrl?: string;
    teamAName?: string;
    teamAShort?: string;
    teamBName?: string;
    teamBShort?: string;
    battingFirst?: "a" | "b";
  };

  const action = body.action || "create_tenant";

  if (action === "owner_login") {
    const store = await readCricketStore();
    if (body.ownerPin !== store.settings.ownerPin) return fail("ওনার পিন ভুল", 401);
    return ok({
      ok: true,
      settings: store.settings,
      tenants: store.tenants.map(publicTenant),
    });
  }

  if (action === "create_tenant") {
    const store = await readCricketStore();
    if (body.ownerPin !== store.settings.ownerPin) return fail("ওনার পিন ভুল", 401);
    const name = (body.name || "").trim();
    if (!name) return fail("ক্লাবের নাম লাগবে");
    let slug = slugify(body.slug || name);
    const exists = store.tenants.some((t) => t.slug === slug);
    if (exists) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    const days = Math.max(1, body.days || (body.plan === "daily" ? 1 : body.plan === "weekly" ? 7 : body.plan === "event" ? 3 : 30));
    const tenant: Tenant = {
      id: newId("tenant"),
      slug,
      name,
      contactPhone: (body.contactPhone || "").trim(),
      pin: (body.pin || "1234").trim(),
      plan: body.plan || "event",
      expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
      active: true,
      brandColor: body.brandColor || "#0B6E4F",
      createdAt: new Date().toISOString(),
    };
    await updateCricketStore((s) => {
      s.tenants.unshift(tenant);
    });
    return ok({ tenant: publicTenant(tenant) });
  }

  if (action === "update_tenant") {
    const store = await readCricketStore();
    if (body.ownerPin !== store.settings.ownerPin) return fail("ওনার পিন ভুল", 401);
    const updated = await updateCricketStore((s) => {
      const t = s.tenants.find((x) => x.id === body.tenantId);
      if (!t) return;
      if (typeof body.active === "boolean") t.active = body.active;
      if (body.days && body.days > 0) {
        t.expiresAt = new Date(Date.now() + body.days * 86400000).toISOString();
      }
      if (body.plan) t.plan = body.plan;
      if (body.pin) t.pin = body.pin;
      if (body.name) t.name = body.name.trim();
      if (body.brandColor) t.brandColor = body.brandColor;
    });
    const tenant = updated.tenants.find((t) => t.id === body.tenantId);
    if (!tenant) return fail("tenant not found", 404);
    return ok({ tenant: publicTenant(tenant) });
  }

  if (action === "tenant_login") {
    const store = await readCricketStore();
    const tenant = findTenantBySlug(store, body.slug || "");
    if (!tenant) return fail("ক্লাব পাওয়া যায়নি", 404);
    if (!tenantAccessOk(tenant)) return fail("রেন্ট মেয়াদ শেষ বা নিষ্ক্রিয়", 403);
    if (body.tenantPin !== tenant.pin) return fail("পিন ভুল", 401);
    return ok({ tenant: publicTenant(tenant), matches: matchesForTenant(store, tenant.id) });
  }

  if (action === "create_match") {
    const store = await readCricketStore();
    const tenant = findTenantBySlug(store, body.slug || "");
    if (!tenant) return fail("ক্লাব পাওয়া যায়নি", 404);
    if (!tenantAccessOk(tenant)) return fail("রেন্ট মেয়াদ শেষ বা নিষ্ক্রিয়", 403);
    if (body.tenantPin !== tenant.pin) return fail("পিন ভুল", 401);

    const battingFirst = body.battingFirst === "b" ? "b" : "a";
    const teamAName = (body.teamAName || "টিম A").trim();
    const teamBName = (body.teamBName || "টিম B").trim();
    const players = [
      ...makeXi(
        Array.from({ length: 11 }, (_, i) => `${teamAName} #${i + 1}`),
        "a",
      ),
      ...makeXi(
        Array.from({ length: 11 }, (_, i) => `${teamBName} #${i + 1}`),
        "b",
      ),
    ];
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

    const match: Match = {
      id: newId("match"),
      tenantId: tenant.id,
      title: (body.title || `${teamAName} vs ${teamBName}`).trim(),
      format: body.format || "T20",
      status: "upcoming",
      venue: (body.venue || "").trim(),
      videoUrl: (body.videoUrl || "").trim(),
      teamA: {
        name: teamAName,
        short: (body.teamAShort || "TEA").trim().slice(0, 5).toUpperCase(),
      },
      teamB: {
        name: teamBName,
        short: (body.teamBShort || "TEB").trim().slice(0, 5).toUpperCase(),
      },
      players,
      innings: [inn],
      currentInningsIndex: 0,
      events: [],
      commentary: [
        {
          id: newId("c"),
          text: "ম্যাচ তৈরি হয়েছে — স্কোর আপডেট শুরু করুন",
          at: new Date().toISOString(),
        },
      ],
      graphic: { kind: "hidden", updatedAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await updateCricketStore((s) => {
      s.matches.unshift(match);
    });
    return ok({ match });
  }

  return fail("unknown action");
}
