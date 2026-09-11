import { BLOODLINK_OWNER_PATH } from "./bloodlink-admin-path";

export type AppMode = "bloodlink" | "fashion";

/**
 * Prefer the request Host so custom domains never show the wrong brand
 * (e.g. noorzaa.com must stay Noorzaa even if APP_MODE/env/cache is stale).
 */
export function modeFromHost(host: string | null | undefined): AppMode | null {
  const h = (host || "")
    .toLowerCase()
    .split(",")[0]
    ?.trim()
    .split(":")[0]
    ?.trim();
  if (!h) return null;

  if (
    h === "noorzaa.com" ||
    h === "www.noorzaa.com" ||
    h.endsWith(".noorzaa.com") ||
    h === "smartcraftcorner.com" ||
    h === "www.smartcraftcorner.com" ||
    h.endsWith(".smartcraftcorner.com") ||
    h.includes("smartcraftcorner")
  ) {
    return "fashion";
  }

  if (
    h === "bloodlinkbd.org" ||
    h === "www.bloodlinkbd.org" ||
    h.endsWith(".bloodlinkbd.org") ||
    h.includes("bloodlinkbd.org")
  ) {
    return "bloodlink";
  }

  return null;
}

/** Env fallback when Host is unknown (CLI, cron, internal). */
export function modeFromEnv(): AppMode {
  const raw = (process.env.APP_MODE || process.env.NEXT_PUBLIC_APP_MODE || "bloodlink")
    .trim()
    .toLowerCase();
  return raw === "fashion" || raw === "smartcraft" || raw === "smart-craft-corner"
    ? "fashion"
    : "bloodlink";
}

/**
 * Sync mode resolver. Pass Host when available (middleware / client).
 * Without a host hint, uses APP_MODE env only.
 */
export function getAppMode(hostHint?: string | null): AppMode {
  return modeFromHost(hostHint) ?? modeFromEnv();
}

/** Server Components / route handlers — read Host from the incoming request. */
export async function resolveAppMode(): Promise<AppMode> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const fromHost = modeFromHost(host);
    if (fromHost) return fromHost;
  } catch {
    /* not in a request context */
  }
  return modeFromEnv();
}

export function isFashionMode(hostHint?: string | null): boolean {
  return getAppMode(hostHint) === "fashion";
}

export function isBloodlinkMode(hostHint?: string | null): boolean {
  return getAppMode(hostHint) === "bloodlink";
}

/** Browser-only: trust the address bar host. */
export function clientAppMode(): AppMode {
  if (typeof window === "undefined") return modeFromEnv();
  return modeFromHost(window.location.hostname) ?? modeFromEnv();
}

/** Fashion storefront path prefixes (blocked on BloodLink deploy). */
export const FASHION_PATH_PREFIXES = [
  "/shop",
  "/collections",
  "/products",
  "/cart",
  "/checkout",
  "/store-admin",
  "/account",
  "/track",
  "/search",
  "/api/fashion",
] as const;

/** BloodLink path prefixes (blocked on Smart craft corner / Noorzaa deploy). */
export const BLOODLINK_PATH_PREFIXES = [
  "/find",
  "/ambulance",
  "/register",
  "/login",
  "/requests",
  "/dashboard",
  "/admin",
  BLOODLINK_OWNER_PATH,
  "/owner-hq-7f3m",
  "/bl-manage-rony",
  "/notifications",
  "/warnings",
  "/privacy",
  "/api/donors",
  "/api/auth",
  "/api/admin",
  "/api/notifications",
  "/api/cron",
  "/api/push",
  "/api/requests",
  "/api/health",
  "/api/uploads",
  "/api/site-content",
  "/api/banners",
] as const;

export function pathMatchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
