import { NextResponse } from "next/server";
import { getStorageHealth } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const storage = await getStorageHealth();
  return NextResponse.json(
    {
      ok: storage.ok,
      storage,
      appMode: process.env.APP_MODE ?? process.env.NEXT_PUBLIC_APP_MODE ?? "unknown",
      buildId: process.env.BUILD_ID ?? "dev",
      time: new Date().toISOString(),
    },
    { status: storage.ok ? 200 : 503 },
  );
}
