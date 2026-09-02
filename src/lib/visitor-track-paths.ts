import { BLOODLINK_OWNER_PATH } from "./bloodlink-admin-path";

const ADMIN_PATH_PREFIXES = [
  BLOODLINK_OWNER_PATH,
  "/owner-hq-7f3m",
  "/bl-manage-rony",
  "/admin",
  "/store-admin",
] as const;

export function shouldTrackVisit(pathname: string): boolean {
  if (!pathname || pathname === "/") return true;
  if (pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/_next/")) return false;
  if (pathname.startsWith("/__site-blocked")) return false;
  if (pathname === "/icon" || pathname.startsWith("/icon/")) return false;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return false;
  }
  if (ADMIN_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}
