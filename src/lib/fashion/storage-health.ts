import { access, readFile, readdir, stat } from "fs/promises";
import { fashionDataDir, fashionStorePath, fashionUploadDir } from "./paths";

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
  backend: "file";
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
  persistentHint: string;
  error: string | null;
};

/** Read-only health snapshot for Smart Craft store files on DATA_DIR (Railway Volume). */
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

  let persistentHint: string;
  if (volumeMounted) {
    persistentHint =
      "Railway Volume marker found at /app/data — store data should survive redeploys. Automatic backups are kept in /app/data/backups.";
  } else if (storeExists) {
    persistentHint =
      "Store file exists but no volume marker. Add a Railway Volume mounted at /app/data, redeploy, then save once in admin to confirm persistence.";
  } else {
    persistentHint =
      "No store file yet. Add a Railway Volume at /app/data before editing products — otherwise redeploy resets to seed data.";
  }

  const ok = error === null;

  return {
    ok,
    backend: "file",
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
    persistentHint,
    error,
  };
}
