import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { listProducts } from "@/lib/fashion/store";
import { getFashionStorageHealth } from "@/lib/fashion/storage-health";
import {
  getDatabaseUrl,
  hasDatabaseUrl,
  postgresFashionHealth,
  resetPgPool,
} from "@/lib/pg-store";
import {
  clearSavedDatabaseUrl,
  databaseUrlHost,
  getDatabaseUrlSource,
  getSavedDatabaseUrl,
  hasSavedDatabaseUrl,
  isPrivateRailwayUrl,
  normalizeDatabaseUrl,
  saveDatabaseUrl,
} from "@/lib/runtime-env";

function looksLikePostgresUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//i.test(url.trim());
}

export async function GET() {
  const ok = await isFashionAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storage = await getFashionStorageHealth();
  const active = getDatabaseUrl();
  const urlConfigured = hasDatabaseUrl();
  const urlSource = getDatabaseUrlSource();
  return NextResponse.json({
    storage,
    savedUrlOnVolume: hasSavedDatabaseUrl(),
    databaseUrlConfigured: urlConfigured,
    databaseReady: storage.backend === "postgres" && storage.postgresOk === true,
    activeHost: databaseUrlHost(active) || storage.postgresHost,
    activeUrlSource: urlSource.source,
    activeUrlIsPrivate: urlSource.isPrivate,
    postgresError: storage.postgresError,
    backend: storage.backend,
    productCount: storage.productCount,
    orderCount: storage.orderCount,
  });
}

export async function POST(request: Request) {
  const ok = await isFashionAdminAuthenticated();
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

    if (isPrivateRailwayUrl(databaseUrl)) {
      return NextResponse.json(
        {
          error:
            "railway.internal URL accept করা হয় না। Railway → Postgres → Variables → DATABASE_PUBLIC_URL (proxy.rlwy.net) copy করুন।",
          databaseReady: false,
          activeHost: databaseUrlHost(databaseUrl),
        },
        { status: 400 },
      );
    }

    const previousSaved = getSavedDatabaseUrl();

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

    const health = await postgresFashionHealth();
    if (!health.ok) {
      clearSavedDatabaseUrl();
      if (previousSaved && !isPrivateRailwayUrl(previousSaved)) {
        try {
          saveDatabaseUrl(previousSaved);
        } catch {
          /* keep cleared so Railway env URL can take over */
        }
      }
      await resetPgPool();

      const storage = await getFashionStorageHealth();
      const urlSource = getDatabaseUrlSource();
      return NextResponse.json(
        {
          error:
            health.error ||
            "Could not connect to Postgres. Use DATABASE_PUBLIC_URL (proxy.rlwy.net).",
          activeHost: health.host,
          storage,
          savedUrlOnVolume: hasSavedDatabaseUrl(),
          databaseReady: storage.backend === "postgres" && storage.postgresOk === true,
          activeUrlSource: urlSource.source,
          activeUrlIsPrivate: urlSource.isPrivate,
          backend: storage.backend,
          postgresError: storage.postgresError,
        },
        { status: 400 },
      );
    }

    const products = await listProducts();
    const storage = await getFashionStorageHealth();
    const ready = storage.backend === "postgres" && storage.postgresOk === true;

    return NextResponse.json({
      ok: ready,
      productCount: products.length,
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
