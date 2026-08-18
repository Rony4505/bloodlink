import { buildNewMatch, type FixtureInput } from "@/lib/cricket/fixture";
import { tenantAccessOk } from "@/lib/cricket/format";
import { fail, ok, slugify } from "@/lib/cricket/http";
import { buildMatchHistory } from "@/lib/cricket/matchResult";
import { buildPlayerTeamReports, buildTeamStandings } from "@/lib/cricket/stats";
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
    description: t.description || "",
    venue: t.venue || "",
    startDate: t.startDate || "",
    endDate: t.endDate || "",
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

  const tenantMatches = matchesForTenant(store, tenant.id);
  const matches = tenantMatches.map((m) => ({
    id: m.id,
    title: m.title,
    format: m.format,
    status: m.status,
    venue: m.venue,
    teamA: m.teamA,
    teamB: m.teamB,
    updatedAt: m.updatedAt,
    scheduledAt: m.scheduledAt,
    innings: m.innings.map((inn) => ({
      battingTeam: inn.battingTeam,
      runs: inn.runs,
      wickets: inn.wickets,
      legalBalls: inn.legalBalls,
      completed: inn.completed,
    })),
    currentInningsIndex: m.currentInningsIndex,
    target: m.target,
    result: m.result,
  }));

  return ok({
    tenant: publicTenant(tenant),
    matches,
    matchHistory: buildMatchHistory(tenantMatches),
    playerRecords: store.playerRecords?.[tenant.id] || [],
    playerTeamReports: buildPlayerTeamReports(tenantMatches),
    teamStandings: buildTeamStandings(tenantMatches),
  });
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
    scheduledAt?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    matchId?: string;
    fixtures?: FixtureInput[];
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
    return ok({
      tenant: publicTenant(tenant),
      matches: matchesForTenant(store, tenant.id),
      playerRecords: store.playerRecords?.[tenant.id] || [],
      playerTeamReports: buildPlayerTeamReports(matchesForTenant(store, tenant.id)),
      teamStandings: buildTeamStandings(matchesForTenant(store, tenant.id)),
    });
  }

  if (action === "tenant_self_update") {
    const store = await readCricketStore();
    const tenant = findTenantBySlug(store, body.slug || "");
    if (!tenant) return fail("ক্লাব পাওয়া যায়নি", 404);
    if (!tenantAccessOk(tenant)) return fail("রেন্ট মেয়াদ শেষ বা নিষ্ক্রিয়", 403);
    if (body.tenantPin !== tenant.pin) return fail("পিন ভুল", 401);

    const updated = await updateCricketStore((s) => {
      const t = s.tenants.find((x) => x.id === tenant.id);
      if (!t) return;
      if (typeof body.name === "string" && body.name.trim()) t.name = body.name.trim();
      if (typeof body.brandColor === "string" && body.brandColor.trim()) t.brandColor = body.brandColor.trim();
      if (typeof body.contactPhone === "string") t.contactPhone = body.contactPhone.trim();
      if (typeof body.description === "string") t.description = body.description.trim();
      if (typeof body.venue === "string") t.venue = body.venue.trim();
      if (typeof body.startDate === "string") t.startDate = body.startDate.trim() || undefined;
      if (typeof body.endDate === "string") t.endDate = body.endDate.trim() || undefined;
    });
    const next = updated.tenants.find((t) => t.id === tenant.id);
    if (!next) return fail("tenant not found", 404);
    return ok({ tenant: publicTenant(next) });
  }

  if (action === "delete_match") {
    const store = await readCricketStore();
    const tenant = findTenantBySlug(store, body.slug || "");
    if (!tenant) return fail("ক্লাব পাওয়া যায়নি", 404);
    if (!tenantAccessOk(tenant)) return fail("রেন্ট মেয়াদ শেষ বা নিষ্ক্রিয়", 403);
    if (body.tenantPin !== tenant.pin) return fail("পিন ভুল", 401);
    const matchId = (body.matchId || "").trim();
    if (!matchId) return fail("matchId required");

    const target = store.matches.find((m) => m.id === matchId && m.tenantId === tenant.id);
    if (!target) return fail("ম্যাচ পাওয়া যায়নি", 404);
    const balls = target.innings.reduce((n, inn) => n + inn.legalBalls, 0);
    if (target.status === "completed" || balls > 0 || (target.events?.length || 0) > 0) {
      return fail("শুরু বা শেষ হওয়া ম্যাচ মুছতে পারবেন না", 400);
    }

    await updateCricketStore((s) => {
      s.matches = s.matches.filter((m) => m.id !== matchId);
    });
    return ok({ deleted: matchId });
  }

  if (action === "create_matches") {
    const store = await readCricketStore();
    const tenant = findTenantBySlug(store, body.slug || "");
    if (!tenant) return fail("ক্লাব পাওয়া যায়নি", 404);
    if (!tenantAccessOk(tenant)) return fail("রেন্ট মেয়াদ শেষ বা নিষ্ক্রিয়", 403);
    if (body.tenantPin !== tenant.pin) return fail("পিন ভুল", 401);
    const rows = Array.isArray(body.fixtures) ? body.fixtures : [];
    if (rows.length === 0) return fail("কমপক্ষে একটি fixture লাগবে");
    if (rows.length > 30) return fail("একবারে সর্বোচ্চ ৩০টি fixture");

    const created: Match[] = rows.map((row) =>
      buildNewMatch(tenant.id, {
        ...row,
        venue: row.venue || tenant.venue,
      }),
    );

    await updateCricketStore((s) => {
      for (const m of created) s.matches.unshift(m);
    });
    return ok({ matches: created, count: created.length });
  }

  if (action === "create_match") {
    const store = await readCricketStore();
    const tenant = findTenantBySlug(store, body.slug || "");
    if (!tenant) return fail("ক্লাব পাওয়া যায়নি", 404);
    if (!tenantAccessOk(tenant)) return fail("রেন্ট মেয়াদ শেষ বা নিষ্ক্রিয়", 403);
    if (body.tenantPin !== tenant.pin) return fail("পিন ভুল", 401);

    const match = buildNewMatch(tenant.id, {
      title: body.title,
      format: body.format,
      venue: body.venue || tenant.venue,
      videoUrl: body.videoUrl,
      teamAName: body.teamAName,
      teamAShort: body.teamAShort,
      teamBName: body.teamBName,
      teamBShort: body.teamBShort,
      battingFirst: body.battingFirst,
      scheduledAt: body.scheduledAt,
    });

    await updateCricketStore((s) => {
      s.matches.unshift(match);
    });
    return ok({ match });
  }

  return fail("unknown action");
}
