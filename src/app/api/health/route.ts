import { NextResponse } from "next/server";
import { getStorageHealth } from "@/lib/db";
import { getEmailOtpConfigStatus } from "@/lib/otp-delivery";

export const dynamic = "force-dynamic";

export async function GET() {
  const storage = await getStorageHealth();
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
