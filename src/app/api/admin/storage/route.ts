import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getStorageHealth, listDonors } from "@/lib/db";
import {
  hasDatabaseUrl,
  postgresHealth,
  resetPgPool,
} from "@/lib/pg-store";
import {
  hasSavedDatabaseUrl,
  saveDatabaseUrl,
} from "@/lib/runtime-env";

function looksLikePostgresUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//i.test(url.trim());
}

export async function GET() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storage = await getStorageHealth();
  return NextResponse.json({
    storage,
    savedUrlOnVolume: hasSavedDatabaseUrl(),
    databaseReady: hasDatabaseUrl() && storage.backend === "postgres",
  });
}

export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const databaseUrl = String(body.databaseUrl || "").trim();
    if (!looksLikePostgresUrl(databaseUrl)) {
      return NextResponse.json(
        {
          error:
            "Invalid Postgres URL. It must start with postgresql:// or postgres://",
        },
        { status: 400 },
      );
    }

    saveDatabaseUrl(databaseUrl);
    await resetPgPool();

    const health = await postgresHealth();
    if (!health.ok) {
      return NextResponse.json(
        {
          error: health.error || "Could not connect to Postgres",
          storage: await getStorageHealth(),
        },
        { status: 400 },
      );
    }

    // Touch ensureDb via listDonors so file→Postgres migrate can run.
    const donors = await listDonors();
    const storage = await getStorageHealth();

    return NextResponse.json({
      ok: true,
      donorCount: donors.length,
      storage,
      savedUrlOnVolume: true,
      databaseReady: storage.backend === "postgres",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Storage setup failed",
      },
      { status: 500 },
    );
  }
}
