import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const TMP_URL_FILE = "/tmp/bloodlink_database_url";
const DB_FLAG_FILE = "/tmp/bloodlink_db_flag";

function dataDir(): string {
  const configured = process.env["DATA_DIR"];
  if (configured && configured.trim()) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "data");
}

function persistUrlPath(): string {
  return path.join(dataDir(), ".database_url");
}

/**
 * Next.js can strip process.env at build/bundle time.
 * We also support owner-saved URL on the data volume.
 */
function readProcEnviron(): Record<string, string> {
  try {
    const raw = readFileSync("/proc/self/environ", "utf8");
    const out: Record<string, string> = {};
    for (const part of raw.split("\0")) {
      if (!part) continue;
      const eq = part.indexOf("=");
      if (eq === -1) continue;
      out[part.slice(0, eq)] = part.slice(eq + 1);
    }
    return out;
  } catch {
    return {};
  }
}

function readProcessEnv(name: string): string {
  try {
    const env = new Function("return process.env")() as NodeJS.ProcessEnv;
    return (env?.[name] || "").trim();
  } catch {
    return "";
  }
}

function readUrlFile(filePath: string): string {
  try {
    if (!existsSync(filePath)) return "";
    return readFileSync(filePath, "utf8").trim();
  } catch {
    return "";
  }
}

function readSavedUrl(): string {
  return readUrlFile(persistUrlPath()) || readUrlFile(TMP_URL_FILE);
}

export function saveDatabaseUrl(url: string): void {
  const trimmed = url.trim();
  mkdirSync(dataDir(), { recursive: true });
  writeFileSync(persistUrlPath(), trimmed, "utf8");
  try {
    writeFileSync(TMP_URL_FILE, trimmed, "utf8");
    writeFileSync(DB_FLAG_FILE, "1", "utf8");
  } catch {
    // /tmp may be unavailable in some local environments
  }
}

export function hasSavedDatabaseUrl(): boolean {
  return readSavedUrl().length > 0;
}

export function runtimeEnv(name: string): string {
  const fromSaved =
    name === "DATABASE_URL" ||
    name === "DATABASE_PRIVATE_URL" ||
    name === "POSTGRES_URL" ||
    name === "POSTGRES_PRIVATE_URL"
      ? readSavedUrl()
      : "";
  if (fromSaved) return fromSaved;

  const fromProcess = readProcessEnv(name);
  if (fromProcess) return fromProcess;

  const fromProc = readProcEnviron()[name];
  return (fromProc || "").trim();
}

export function runtimeDbUrl(): string {
  const fromSaved = readSavedUrl();
  if (fromSaved) return fromSaved;

  const keys = [
    "DATABASE_URL",
    "DATABASE_PRIVATE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRIVATE_URL",
  ];
  for (const key of keys) {
    const value = readProcessEnv(key) || readProcEnviron()[key] || "";
    if (value.trim()) return value.trim();
  }
  return "";
}

export function runtimeDbEnvKeys(): string[] {
  const names = new Set<string>();
  if (readUrlFile(persistUrlPath())) names.add("DATABASE_URL(volume)");
  if (readUrlFile(TMP_URL_FILE)) names.add("DATABASE_URL(tmp)");
  try {
    const env = new Function("return process.env")() as NodeJS.ProcessEnv;
    for (const key of Object.keys(env || {})) {
      if (/database|postgres|^pg/i.test(key)) names.add(key);
    }
  } catch {
    // ignore
  }
  for (const key of Object.keys(readProcEnviron())) {
    if (/database|postgres|^pg/i.test(key)) names.add(key);
  }
  return [...names].sort();
}

export function runtimeDbFlag(): "1" | "0" | "missing" {
  if (readSavedUrl()) return "1";
  try {
    if (!existsSync(DB_FLAG_FILE)) return "missing";
    const value = readFileSync(DB_FLAG_FILE, "utf8").trim();
    return value === "1" ? "1" : "0";
  } catch {
    return "missing";
  }
}
