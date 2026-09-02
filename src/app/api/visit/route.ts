import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionDonorId } from "@/lib/auth";
import {
  extractClientIp,
  recordVisitorVisit,
  shouldTrackVisit,
} from "@/lib/visitor-analytics";

export async function POST(request: NextRequest) {
  let body: { path?: string } = {};
  try {
    body = (await request.json()) as { path?: string };
  } catch {
    body = {};
  }

  const path = body.path?.trim() || "/";
  if (!shouldTrackVisit(path)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const forwarded =
    request.headers.get("x-visit-forwarded-for") ||
    request.headers.get("x-forwarded-for");
  const ip = extractClientIp(forwarded);
  const referrer =
    request.headers.get("x-visit-referrer") || request.headers.get("referer");
  const userAgent =
    request.headers.get("x-visit-user-agent") || request.headers.get("user-agent");
  const donorId = await getSessionDonorId();

  void recordVisitorVisit({
    path,
    referrer,
    ip,
    donorId,
    userAgent,
  }).catch((err) => {
    console.error("[bloodlink] record visit failed:", err);
  });

  return NextResponse.json({ ok: true });
}
