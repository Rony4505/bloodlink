import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { restoreDatabaseFromBackup } from "@/lib/db";

export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON backup" }, { status: 400 });
  }

  try {
    const result = await restoreDatabaseFromBackup(body);
    return NextResponse.json({
      ok: true,
      donorCount: result.donorCount,
      message: `Restored ${result.donorCount} donors`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Restore failed",
      },
      { status: 400 },
    );
  }
}
