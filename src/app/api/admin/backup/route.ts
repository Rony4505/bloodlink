import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { exportDatabaseSnapshot } from "@/lib/db";

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await exportDatabaseSnapshot();
  const stamp = new Date().toISOString().slice(0, 10);
  const body = JSON.stringify(snapshot, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="bloodlink-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
