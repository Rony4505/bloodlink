import { createHash, randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { hashIp } from "./auth";
import { DISTRICTS } from "./districts";
import {
  hasDatabaseUrl,
  insertVisitToPostgres,
  listVisitsFromPostgres,
  pruneOldVisitsFromPostgres,
  recentDuplicateVisitInPostgres,
} from "./pg-store";
import { shouldTrackVisit } from "./visitor-track-paths";

export { shouldTrackVisit };

export type VisitorVisit = {
  id: string;
  path: string;
  referrer: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  ipHash: string;
  donorId: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type VisitorAnalyticsPeriod = "today" | "7d" | "30d";

export type VisitorAnalyticsSummary = {
  period: VisitorAnalyticsPeriod;
  from: string;
  to: string;
  pageViews: number;
  uniqueVisitors: number;
  loggedInViews: number;
  byDistrict: { district: string; views: number; unique: number }[];
  topPages: { path: string; views: number; unique: number }[];
  recent: {
    id: string;
    path: string;
    district: string | null;
    city: string | null;
    loggedIn: boolean;
    createdAt: string;
  }[];
};

const VISIT_FILE = path.join(process.cwd(), "data", "visitor-visits.json");
const RETENTION_DAYS = 90;
const DEDUP_MINUTES = 30;
const GEO_CACHE_TTL_MS = 60 * 60 * 1000;

const geoCache = new Map<
  string,
  { district: string | null; city: string | null; country: string | null; at: number }
>();

const CITY_ALIASES: Record<string, string> = {
  chittagong: "Chattogram",
  ctg: "Chattogram",
  comilla: "Cumilla",
  jessore: "Jashore",
  barisal: "Barishal",
  bogra: "Bogura",
  "cox's bazar": "Cox's Bazar",
  "coxs bazar": "Cox's Bazar",
  "chapai nawabganj": "Nawabganj",
  nawabganj: "Nawabganj",
  "dhaka city": "Dhaka",
};

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === "unknown") return true;
  if (ip === "::1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  return false;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchDistrict(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const key = normalizeKey(value);
  const alias = CITY_ALIASES[key];
  if (alias) return alias;
  const direct = DISTRICTS.find((d) => normalizeKey(d) === key);
  if (direct) return direct;
  const partial = DISTRICTS.find((d) => key.includes(normalizeKey(d)));
  return partial ?? null;
}

function normalizeGeoDistrict(city: string | null, region: string | null): string | null {
  return matchDistrict(city) ?? matchDistrict(region);
}

async function lookupGeo(
  ip: string,
): Promise<{ district: string | null; city: string | null; country: string | null }> {
  if (isPrivateIp(ip)) {
    return { district: null, city: null, country: null };
  }

  const cacheKey = hashIp(ip);
  const cached = geoCache.get(cacheKey);
  if (cached && Date.now() - cached.at < GEO_CACHE_TTL_MS) {
    return {
      district: cached.district,
      city: cached.city,
      country: cached.country,
    };
  }

  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
    });
    if (!res.ok) {
      return { district: null, city: null, country: null };
    }
    const data = (await res.json()) as {
      success?: boolean;
      city?: string;
      region?: string;
      country_code?: string;
    };
    if (!data.success) {
      return { district: null, city: null, country: null };
    }
    const city = data.city?.trim() || null;
    const region = data.region?.trim() || null;
    const district = normalizeGeoDistrict(city, region);
    const country = data.country_code?.trim()?.toUpperCase() || null;
    geoCache.set(cacheKey, { district, city, country, at: Date.now() });
    return { district, city, country };
  } catch {
    return { district: null, city: null, country: null };
  }
}

async function loadVisitsFromFile(): Promise<VisitorVisit[]> {
  try {
    const raw = await readFile(VISIT_FILE, "utf8");
    const parsed = JSON.parse(raw) as VisitorVisit[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveVisitsToFile(visits: VisitorVisit[]): Promise<void> {
  await mkdir(path.dirname(VISIT_FILE), { recursive: true });
  await writeFile(VISIT_FILE, JSON.stringify(visits, null, 0), "utf8");
}

function cutoffIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function periodRange(period: VisitorAnalyticsPeriod): { from: string; to: string } {
  const to = new Date().toISOString();
  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to };
  }
  const days = period === "7d" ? 7 : 30;
  return { from: cutoffIso(days), to };
}

function truncate(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

async function hasRecentDuplicate(ipHash: string, visitPath: string): Promise<boolean> {
  if (hasDatabaseUrl()) {
    try {
      return await recentDuplicateVisitInPostgres(ipHash, visitPath, DEDUP_MINUTES);
    } catch (err) {
      console.error("[bloodlink] visit dedup postgres failed:", err);
    }
  }

  const visits = await loadVisitsFromFile();
  const cutoff = Date.now() - DEDUP_MINUTES * 60 * 1000;
  return visits.some(
    (v) =>
      v.ipHash === ipHash &&
      v.path === visitPath &&
      new Date(v.createdAt).getTime() >= cutoff,
  );
}

async function appendVisitFile(visit: VisitorVisit): Promise<void> {
  const visits = await loadVisitsFromFile();
  visits.push(visit);
  const retentionCutoff = cutoffIso(RETENTION_DAYS);
  const trimmed = visits.filter((v) => v.createdAt >= retentionCutoff);
  await saveVisitsToFile(trimmed);
}

export async function recordVisitorVisit(input: {
  path: string;
  referrer?: string | null;
  ip: string;
  donorId?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const visitPath = truncate(input.path, 500) ?? "/";
  if (!shouldTrackVisit(visitPath)) return;

  const ipHash = hashIp(input.ip);
  if (await hasRecentDuplicate(ipHash, visitPath)) return;

  const geo = await lookupGeo(input.ip);
  const visit: VisitorVisit = {
    id: randomUUID(),
    path: visitPath,
    referrer: truncate(input.referrer, 500),
    district: geo.district,
    city: geo.city,
    country: geo.country,
    ipHash,
    donorId: input.donorId ?? null,
    userAgent: truncate(input.userAgent, 300),
    createdAt: new Date().toISOString(),
  };

  if (hasDatabaseUrl()) {
    try {
      await insertVisitToPostgres(visit);
      if (Math.random() < 0.02) {
        void pruneOldVisitsFromPostgres(RETENTION_DAYS).catch(() => undefined);
      }
      return;
    } catch (err) {
      console.error("[bloodlink] visit postgres insert failed — file fallback:", err);
    }
  }

  await appendVisitFile(visit);
}

function aggregateVisits(
  visits: VisitorVisit[],
  period: VisitorAnalyticsPeriod,
): VisitorAnalyticsSummary {
  const { from, to } = periodRange(period);
  const inRange = visits.filter((v) => v.createdAt >= from && v.createdAt <= to);

  const districtMap = new Map<string, { views: number; unique: Set<string> }>();
  const pageMap = new Map<string, { views: number; unique: Set<string> }>();
  const uniqueAll = new Set<string>();
  let loggedInViews = 0;

  for (const v of inRange) {
    uniqueAll.add(v.ipHash);
    if (v.donorId) loggedInViews += 1;

    const districtKey = v.district?.trim() || "Unknown";
    const districtEntry = districtMap.get(districtKey) ?? { views: 0, unique: new Set<string>() };
    districtEntry.views += 1;
    districtEntry.unique.add(v.ipHash);
    districtMap.set(districtKey, districtEntry);

    const pageEntry = pageMap.get(v.path) ?? { views: 0, unique: new Set<string>() };
    pageEntry.views += 1;
    pageEntry.unique.add(v.ipHash);
    pageMap.set(v.path, pageEntry);
  }

  const byDistrict = [...districtMap.entries()]
    .map(([district, stats]) => ({
      district,
      views: stats.views,
      unique: stats.unique.size,
    }))
    .sort((a, b) => b.views - a.views || a.district.localeCompare(b.district));

  const topPages = [...pageMap.entries()]
    .map(([path, stats]) => ({
      path,
      views: stats.views,
      unique: stats.unique.size,
    }))
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
    .slice(0, 15);

  const recent = [...inRange]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 40)
    .map((v) => ({
      id: v.id,
      path: v.path,
      district: v.district,
      city: v.city,
      loggedIn: Boolean(v.donorId),
      createdAt: v.createdAt,
    }));

  return {
    period,
    from,
    to,
    pageViews: inRange.length,
    uniqueVisitors: uniqueAll.size,
    loggedInViews,
    byDistrict,
    topPages,
    recent,
  };
}

export async function getVisitorAnalytics(
  period: VisitorAnalyticsPeriod,
): Promise<VisitorAnalyticsSummary> {
  const { from } = periodRange(period);

  if (hasDatabaseUrl()) {
    try {
      const visits = await listVisitsFromPostgres(from);
      return aggregateVisits(visits, period);
    } catch (err) {
      console.error("[bloodlink] visit analytics postgres failed — file fallback:", err);
    }
  }

  const visits = await loadVisitsFromFile();
  return aggregateVisits(visits, period);
}

export function extractClientIp(forwarded: string | null): string {
  const ip = forwarded?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : "unknown";
}

export function visitStorageFingerprint(): string {
  return createHash("sha256")
    .update(hasDatabaseUrl() ? "postgres" : "file")
    .digest("hex")
    .slice(0, 8);
}
