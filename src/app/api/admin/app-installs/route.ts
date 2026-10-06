import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAppInstalls } from "@/lib/db";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const installs = await listAppInstalls();
  return NextResponse.json({
    installs,
    total: installs.length,
    play: installs.filter((i) => i.source === "play").length,
    pwa: installs.filter((i) => i.source === "pwa").length,
    linked: installs.filter((i) => i.donorId).length,
  });
}
