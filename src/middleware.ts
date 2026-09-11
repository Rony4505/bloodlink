import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  BLOODLINK_PATH_PREFIXES,
  FASHION_PATH_PREFIXES,
  getAppMode,
  pathMatchesPrefix,
} from "@/lib/app-mode";
import { shouldTrackVisit } from "@/lib/visitor-track-paths";

function notFound(request: NextRequest, api: boolean) {
  if (api) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/__site-blocked";
  return NextResponse.rewrite(url);
}

function trackVisit(request: NextRequest, pathname: string) {
  if (!shouldTrackVisit(pathname)) return;

  const url = new URL("/api/visit", request.url);
  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-visit-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      "x-visit-referrer": request.headers.get("referer") ?? "",
      "x-visit-user-agent": request.headers.get("user-agent") ?? "",
    },
    body: JSON.stringify({ path: pathname }),
  }).catch(() => undefined);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const mode = getAppMode(host);
  const isApi = pathname.startsWith("/api/");

  // Browsers always request /favicon.ico — map to mode-correct generated icon
  // so fashion (Noorzaa) never serves BloodLink's maroon "B".
  if (
    pathname === "/favicon.ico" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/apple-touch-icon-precomposed.png"
  ) {
    const dest = pathname === "/favicon.ico" ? "/icon" : "/apple-icon";
    if (mode === "fashion") {
      return NextResponse.rewrite(new URL(dest, request.url));
    }
    if (pathname === "/favicon.ico") {
      return NextResponse.rewrite(new URL("/bloodlink/favicon.ico", request.url));
    }
    return NextResponse.next();
  }

  if (mode === "bloodlink") {
    if (pathMatchesPrefix(pathname, FASHION_PATH_PREFIXES)) {
      return notFound(request, isApi);
    }

    // Public healthcare / স্বাস্থ্য সেবা temporarily offline (Play Store policy).
    // Admin APIs under /api/admin/healthcare remain available.
    if (
      pathname === "/healthcare" ||
      pathname.startsWith("/healthcare/") ||
      pathname === "/api/healthcare" ||
      pathname.startsWith("/api/healthcare/") ||
      pathname === "/api/public/healthcare" ||
      pathname.startsWith("/api/public/healthcare/")
    ) {
      if (isApi) {
        return NextResponse.json(
          { error: "Healthcare services are currently unavailable." },
          { status: 404 },
        );
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!isApi) {
      trackVisit(request, pathname);
    }
    const res = NextResponse.next();
    res.headers.set("Vary", "Host");
    return res;
  }

  // Fashion / Noorzaa — never expose BloodLink brand icon files.
  if (
    pathname === "/icon-48.png" ||
    pathname === "/icon-192.png" ||
    pathname === "/icon-512.png" ||
    pathname === "/bloodlink-logo.png" ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.rewrite(new URL("/icon", request.url));
  }

  // Smart craft corner (fashion) mode — own site at root
  if (pathname === "/shop" || pathname === "/shop/") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname === "/shop/about" || pathname.startsWith("/shop/about/")) {
    return NextResponse.redirect(new URL("/about", request.url));
  }
  if (pathname === "/shop/contact" || pathname.startsWith("/shop/contact/")) {
    return NextResponse.redirect(new URL("/contact", request.url));
  }

  if (pathMatchesPrefix(pathname, BLOODLINK_PATH_PREFIXES)) {
    if (pathname === "/api/health" || pathname.startsWith("/api/health/")) {
      return NextResponse.next();
    }
    return notFound(request, isApi);
  }

  const res = NextResponse.next();
  res.headers.set("Vary", "Host");
  // Avoid stale HTML shell being reused across brands/domains.
  if (!isApi && (pathname === "/" || !pathname.includes("."))) {
    res.headers.set("Cache-Control", "private, no-cache, must-revalidate");
  }
  return res;
}

export const config = {
  // Include favicon/icon static names so fashion can rewrite away from BloodLink assets.
  matcher: [
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/apple-touch-icon-precomposed.png",
    "/icon-48.png",
    "/icon-192.png",
    "/icon-512.png",
    "/bloodlink-logo.png",
    "/icons/:path*",
    "/((?!_next/static|_next/image|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|txt|xml|json|map)$).*)",
  ],
};
