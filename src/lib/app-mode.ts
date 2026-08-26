import { BLOODLINK_OWNER_PATH } from "./bloodlink-admin-path";

export type AppMode = "bloodlink" | "fashion";

/** Runtime site mode — BloodLink and Smart craft corner deploy as separate services. */
export function getAppMode(): AppMode {
  const raw = (process.env.APP_MODE || process.env.NEXT_PUBLIC_APP_MODE || "bloodlink")
    .trim()
    .toLowerCase();
  return raw === "fashion" || raw === "smartcraft" || raw === "smart-craft-corner"
    ? "fashion"
    : "bloodlink";
}

export function isFashionMode(): boolean {
  return getAppMode() === "fashion";
}

export function isBloodlinkMode(): boolean {
  return getAppMode() === "bloodlink";
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

/** BloodLink path prefixes (blocked on Smart craft corner deploy). */
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
