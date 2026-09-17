import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { shouldTrackVisit } from "@/lib/visitor-track-paths";

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
  const isApi = pathname.startsWith("/api/");

  // Browsers always request /favicon.ico — serve the BloodLink favicon file.
  if (pathname === "/favicon.ico") {
    return NextResponse.rewrite(new URL("/bloodlink/favicon.ico", request.url));
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
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/favicon.ico",
    "/((?!_next/static|_next/image|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|txt|xml|json|map)$).*)",
  ],
};
