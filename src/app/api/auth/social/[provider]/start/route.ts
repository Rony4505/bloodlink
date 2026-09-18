import { NextResponse } from "next/server";
import {
  beginSocialFlow,
  isSocialProvider,
  requestOrigin,
  socialProviderAvailability,
} from "@/lib/social-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const origin = requestOrigin(request);
  if (!isSocialProvider(provider) || !socialProviderAvailability()[provider]) {
    return NextResponse.redirect(new URL("/login?social_error=unavailable", origin));
  }
  const next = new URL(request.url).searchParams.get("next") || "";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const authUrl = await beginSocialFlow(provider, origin, safeNext);
  return NextResponse.redirect(authUrl);
}
