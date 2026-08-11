import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getStorageHealth, listDonors } from "@/lib/db";
import {
  getDatabaseUrl,
  postgresHealth,
  resetPgPool,
} from "@/lib/pg-store";
import {
  databaseUrlHost,
  hasSavedDatabaseUrl,
  normalizeDatabaseUrl,
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
  const active = getDatabaseUrl();
  return NextResponse.json({
    storage,
    savedUrlOnVolume: hasSavedDatabaseUrl(),
    databaseReady: storage.backend === "postgres" && storage.postgresOk === true,
    activeHost: databaseUrlHost(active),
  });
}

export async function POST(request: Request) {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const databaseUrl = normalizeDatabaseUrl(String(body.databaseUrl || ""));
    if (!looksLikePostgresUrl(databaseUrl)) {
      return NextResponse.json(
        {
          error:
            "Invalid Postgres URL. It must start with postgresql:// or postgres://",
        },
        { status: 400 },
      );
    }

    // Private railway.internal is OK when BloodLink and Postgres share a Railway project.
    // Public proxy URLs also work (with sslmode=no-verify for Railway's self-signed cert).

    try {
      saveDatabaseUrl(databaseUrl);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Could not save DATABASE_URL to disk",
        },
        { status: 500 },
      );
    }

    await resetPgPool();

    const health = await postgresHealth();
    if (!health.ok) {
      return NextResponse.json(
        {
          error:
            health.error ||
            "Could not connect to Postgres. Use DATABASE_PUBLIC_URL (proxy.rlwy.net).",
          activeHost: health.host,
          storage: await getStorageHealth(),
          savedUrlOnVolume: hasSavedDatabaseUrl(),
          databaseReady: false,
        },
        { status: 400 },
      );
    }

    // Migrate file → Postgres when needed.
    const donors = await listDonors();
    const storage = await getStorageHealth();
    const ready = storage.backend === "postgres" && storage.postgresOk === true;

    return NextResponse.json({
      ok: ready,
      donorCount: donors.length,
      storage,
      savedUrlOnVolume: hasSavedDatabaseUrl(),
      databaseReady: ready,
      activeHost: health.host,
      error: ready
        ? null
        : storage.error ||
          "Connected once, but storage backend is not postgres yet. Try Save again.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Storage setup failed",
        databaseReady: false,
      },
      { status: 500 },
    );
  }
}
