import { NextResponse } from "next/server";
import { getStorageHealth } from "@/lib/db";
import { getFashionStorageHealth } from "@/lib/fashion/store";

export const dynamic = "force-dynamic";

function isFashionMode(): boolean {
  const mode = process.env.APP_MODE ?? process.env.NEXT_PUBLIC_APP_MODE ?? "";
  return mode === "fashion";
}

export async function GET() {
  const storage = isFashionMode() ? await getFashionStorageHealth() : await getStorageHealth();
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
