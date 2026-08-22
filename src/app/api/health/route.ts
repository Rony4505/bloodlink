import { NextResponse } from "next/server";
import { getStorageHealth } from "@/lib/db";
import { getFashionStorageHealth } from "@/lib/fashion/storage-health";
import { isFashionMode } from "@/lib/app-mode";
import { getEmailOtpConfigStatus } from "@/lib/otp-delivery";

export const dynamic = "force-dynamic";

export async function GET() {
  const fashion = isFashionMode();
  const storage = fashion ? await getFashionStorageHealth() : await getStorageHealth();
  const emailOtp = getEmailOtpConfigStatus();
  return NextResponse.json(
    {
      ok: storage.ok,
      storage,
      emailOtp,
      appMode: process.env.APP_MODE ?? process.env.NEXT_PUBLIC_APP_MODE ?? "unknown",
      buildId: process.env.BUILD_ID ?? "dev",
      time: new Date().toISOString(),
    },
    { status: storage.ok ? 200 : 503 },
  );
}
