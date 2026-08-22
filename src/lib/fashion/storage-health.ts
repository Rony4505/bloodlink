import { access, readFile, readdir, stat } from "fs/promises";
import { fashionDataDir, fashionStorePath, fashionUploadDir } from "./paths";
import { hasDatabaseUrl, postgresFashionHealth } from "../pg-store";

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export type FashionStorageHealth = {
  ok: boolean;
  backend: "postgres" | "file" | "file-fallback";
  dataDir: string;
  storePath: string;
  storeExists: boolean;
  backupExists: boolean;
  rotatingBackupCount: number;
  latestRotatingBackupAt: string | null;
  uploadDir: string;
  storeModifiedAt: string | null;
  storeSizeBytes: number | null;
  productCount: number | null;
  orderCount: number | null;
  customerCount: number | null;
  volumeMounted: boolean | null;
  postgresOk: boolean | null;
  postgresHost: string | null;
  postgresError: string | null;
  persistentHint: string;
  error: string | null;
};

/** Read-only health snapshot for Smart Craft store (Postgres primary, file mirror + backups). */
export async function getFashionStorageHealth(): Promise<FashionStorageHealth> {
  const dataDir = fashionDataDir();
  const storePath = fashionStorePath();
  const backupPath = `${storePath}.bak`;
  const uploadDir = fashionUploadDir();
  const volumeMarkerPath = `${dataDir}/.volume-mounted`;

  let storeExists = false;
  let backupExists = false;
  let rotatingBackupCount = 0;
  let latestRotatingBackupAt: string | null = null;
  let storeModifiedAt: string | null = null;
  let storeSizeBytes: number | null = null;
  let productCount: number | null = null;
  let orderCount: number | null = null;
  let customerCount: number | null = null;
  let volumeMounted: boolean | null = null;
  let postgresOk: boolean | null = null;
  let postgresHost: string | null = null;
  let postgresError: string | null = null;
  let error: string | null = null;

  storeExists = await fileExists(storePath);
  backupExists = await fileExists(backupPath);
  volumeMounted = await fileExists(volumeMarkerPath);

  try {
    const backupsDir = `${dataDir}/backups`;
    const names = (await readdir(backupsDir))
      .filter((name) => name.startsWith("fashion-store-") && name.endsWith(".json"))
      .sort()
      .reverse();
    rotatingBackupCount = names.length;
    if (names.length > 0) {
      const latest = await stat(`${backupsDir}/${names[0]}`);
      latestRotatingBackupAt = latest.mtime.toISOString();
    }
  } catch {
    /* no backups dir yet */
  }

  if (storeExists) {
    try {
      const info = await stat(storePath);
      storeModifiedAt = info.mtime.toISOString();
      storeSizeBytes = info.size;
      const raw = await readFile(storePath, "utf8");
      const parsed = JSON.parse(raw) as {
        products?: unknown[];
        orders?: unknown[];
        customers?: unknown[];
      };
      productCount = Array.isArray(parsed.products) ? parsed.products.length : null;
      orderCount = Array.isArray(parsed.orders) ? parsed.orders.length : null;
      customerCount = Array.isArray(parsed.customers) ? parsed.customers.length : null;
    } catch (err) {
      error = err instanceof Error ? err.message : "Could not read fashion store file";
    }
  }

  if (hasDatabaseUrl()) {
    const pg = await postgresFashionHealth();
    postgresOk = pg.ok;
    postgresHost = pg.host || null;
    postgresError = pg.error;
    if (pg.ok) {
      productCount = pg.productCount;
      orderCount = pg.orderCount;
      customerCount = pg.customerCount;
    } else if (!error) {
      error = pg.error;
    }
  }

  let backend: FashionStorageHealth["backend"] = "file";
  if (hasDatabaseUrl()) {
    backend = postgresOk ? "postgres" : "file-fallback";
  }

  let persistentHint: string;
  if (backend === "postgres" && postgresOk) {
    persistentHint =
      "Postgres is active — products, orders, and settings survive redeploys. File mirror + /app/data/backups kept as extra safety.";
  } else if (volumeMounted) {
    persistentHint =
      "File storage on Railway Volume at /app/data. Add Postgres (recommended) via Admin → Backup → Database URL for permanent storage.";
  } else if (storeExists) {
    persistentHint =
      "Store file exists but no volume marker. Mount Volume at /app/data and add Postgres so redeploy never wipes data.";
  } else {
    persistentHint =
      "No store file yet. Add Railway Postgres + Volume at /app/data before editing products.";
  }

  const ok = error === null && (backend !== "postgres" || postgresOk === true);

  return {
    ok,
    backend,
    dataDir,
    storePath,
    storeExists,
    backupExists,
    rotatingBackupCount,
    latestRotatingBackupAt,
    uploadDir,
    storeModifiedAt,
    storeSizeBytes,
    productCount,
    orderCount,
    customerCount,
    volumeMounted,
    postgresOk,
    postgresHost,
    postgresError,
    persistentHint,
    error,
  };
}
