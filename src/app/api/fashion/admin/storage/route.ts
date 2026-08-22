import { NextResponse } from "next/server";
import { isFashionAdminAuthenticated } from "@/lib/fashion/customer-auth";
import { listProducts } from "@/lib/fashion/store";
import { getFashionStorageHealth } from "@/lib/fashion/storage-health";
import {
  getDatabaseUrl,
  postgresFashionHealth,
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
  const ok = await isFashionAdminAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storage = await getFashionStorageHealth();
  const active = getDatabaseUrl();
  return NextResponse.json({
    storage,
    savedUrlOnVolume: hasSavedDatabaseUrl(),
    databaseReady: storage.backend === "postgres" && storage.postgresOk === true,
    activeHost: databaseUrlHost(active),
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
      return NextResponse.json(
        {
          error:
            health.error ||
            "Could not connect to Postgres. Use DATABASE_PUBLIC_URL (proxy.rlwy.net).",
          activeHost: health.host,
          storage: await getFashionStorageHealth(),
          savedUrlOnVolume: hasSavedDatabaseUrl(),
          databaseReady: false,
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
