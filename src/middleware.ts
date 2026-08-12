import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  BLOODLINK_PATH_PREFIXES,
  FASHION_PATH_PREFIXES,
  getAppMode,
  pathMatchesPrefix,
} from "@/lib/app-mode";

function notFound(request: NextRequest, api: boolean) {
  if (api) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/__site-blocked";
  return NextResponse.rewrite(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mode = getAppMode();
  const isApi = pathname.startsWith("/api/");

  if (mode === "bloodlink") {
    if (pathMatchesPrefix(pathname, FASHION_PATH_PREFIXES)) {
      return notFound(request, isApi);
    }
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  // Do not skip paths like /bloodlinkbd.admin.rony4505 — only skip real static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|txt|xml|json|map)$).*)",
  ],
};
