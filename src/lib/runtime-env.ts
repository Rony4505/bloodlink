import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
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

function firstEnvUrl(keys: string[]): string {
  for (const key of keys) {
    const value = readProcessEnv(key) || readProcEnviron()[key] || "";
    if (value.trim()) return value.trim();
  }
  return "";
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
  // Make the current Node process use the owner-pasted URL immediately
  // (Railway may still inject a private *.railway.internal DATABASE_URL).
  try {
    process.env.DATABASE_URL = trimmed;
    process.env.DATABASE_PUBLIC_URL = trimmed;
  } catch {
    // ignore
  }
}

export function clearSavedDatabaseUrl(): void {
  try {
    if (existsSync(persistUrlPath())) unlinkSync(persistUrlPath());
  } catch {
    // ignore
  }
  try {
    if (existsSync(TMP_URL_FILE)) unlinkSync(TMP_URL_FILE);
    writeFileSync(DB_FLAG_FILE, "0", "utf8");
  } catch {
    // ignore
  }
}

export function hasSavedDatabaseUrl(): boolean {
  return readSavedUrl().length > 0;
}

export function runtimeEnv(name: string): string {
  const fromProcess = readProcessEnv(name);
  if (fromProcess) return fromProcess;

  const fromProc = readProcEnviron()[name];
  if (fromProc) return fromProc.trim();

  if (
    name === "DATABASE_URL" ||
    name === "DATABASE_PRIVATE_URL" ||
    name === "POSTGRES_URL" ||
    name === "POSTGRES_PRIVATE_URL"
  ) {
    return readSavedUrl();
  }
  return "";
}

export function runtimeDbUrl(): string {
  // Owner-pasted URL in Settings always wins over Railway's injected private URL.
  const saved = readSavedUrl();
  if (saved) return saved;

  const envCandidates = [
    "DATABASE_PUBLIC_URL",
    "DATABASE_URL",
    "POSTGRES_URL",
    "DATABASE_PRIVATE_URL",
    "POSTGRES_PRIVATE_URL",
  ]
    .map((key) => firstEnvUrl([key]))
    .filter(Boolean);

  const publicish = envCandidates.find((u) => !isPrivateRailwayUrl(u));
  if (publicish) return publicish;
  return envCandidates[0] || "";
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
  if (runtimeDbUrl()) return "1";
  try {
    if (!existsSync(DB_FLAG_FILE)) return "missing";
    const value = readFileSync(DB_FLAG_FILE, "utf8").trim();
    return value === "1" ? "1" : "0";
  } catch {
    return "missing";
  }
}

export function isPrivateRailwayUrl(url: string): boolean {
  return /railway\.internal/i.test(url);
}
