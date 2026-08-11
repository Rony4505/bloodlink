import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import path from "path";

const TMP_URL_FILE = "/tmp/bloodlink_database_url";
const DB_FLAG_FILE = "/tmp/bloodlink_db_flag";

/** In-process override so the same request that saves a URL can connect immediately. */
let urlOverride: string | null = null;

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
    return readFileSync(filePath, "utf8").trim().replace(/\r?\n/g, "");
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

export function isPrivateRailwayUrl(url: string): boolean {
  return /railway\.internal/i.test(url);
}

export function normalizeDatabaseUrl(raw: string): string {
  let url = raw.trim().replace(/^["']+|["']+$/g, "").replace(/\r?\n/g, "");
  if (!url) return "";

  // Railway Postgres (public proxy + private) uses a self-signed cert.
  // sslmode=require still verifies the chain and fails with:
  // "self-signed certificate in certificate chain".
  if (/rlwy\.net|railway\.internal|railway\.app/i.test(url)) {
    url = url
      .replace(/([?&])sslmode=[^&]*/gi, "$1")
      .replace(/[?&]$/, "")
      .replace(/\?&/, "?");
    url += (url.includes("?") ? "&" : "?") + "sslmode=no-verify";
    return url;
  }

  if (
    !/[?&]sslmode=/i.test(url) &&
    /supabase\.co|neon\.tech|amazonaws\.com/i.test(url)
  ) {
    url += (url.includes("?") ? "&" : "?") + "sslmode=require";
  }
  return url;
}

export function databaseUrlHost(url: string): string {
  try {
    const u = new URL(url.replace(/^postgres(ql)?:/i, "http:"));
    return u.hostname || "";
  } catch {
    return "";
  }
}

export function saveDatabaseUrl(url: string): void {
  const trimmed = normalizeDatabaseUrl(url);
  if (!trimmed) {
    throw new Error("Empty database URL");
  }

  urlOverride = trimmed;
  mkdirSync(dataDir(), { recursive: true });

  let persisted = false;
  try {
    writeFileSync(persistUrlPath(), trimmed, "utf8");
    persisted = readUrlFile(persistUrlPath()) === trimmed;
  } catch (err) {
    console.error("[bloodlink] could not write volume database URL:", err);
  }

  try {
    writeFileSync(TMP_URL_FILE, trimmed, "utf8");
    writeFileSync(DB_FLAG_FILE, "1", "utf8");
  } catch (err) {
    console.error("[bloodlink] could not write tmp database URL:", err);
  }

  try {
    process.env.DATABASE_URL = trimmed;
    process.env.DATABASE_PUBLIC_URL = trimmed;
  } catch {
    // ignore
  }

  if (!persisted && !readUrlFile(TMP_URL_FILE)) {
    throw new Error(
      "Could not save DATABASE_URL to disk. Mount a Railway Volume at /app/data and try again.",
    );
  }
}

export function clearSavedDatabaseUrl(): void {
  urlOverride = null;
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

/** Only wipe private/broken internal URLs — never delete a public owner paste. */
export function clearBrokenPrivateDatabaseUrl(): void {
  const active = runtimeDbUrl();
  if (!active || !isPrivateRailwayUrl(active)) return;
  clearSavedDatabaseUrl();
  try {
    if (isPrivateRailwayUrl(process.env.DATABASE_URL || "")) {
      delete process.env.DATABASE_URL;
    }
  } catch {
    // ignore
  }
}

export function hasSavedDatabaseUrl(): boolean {
  return readSavedUrl().length > 0 || Boolean(urlOverride);
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
    name === "POSTGRES_PRIVATE_URL" ||
    name === "DATABASE_PUBLIC_URL"
  ) {
    return readSavedUrl();
  }
  return "";
}

export function runtimeDbUrl(): string {
  if (urlOverride) return urlOverride;

  // Owner-pasted URL always wins over Railway-injected private URL.
  const saved = readSavedUrl();
  if (saved) return normalizeDatabaseUrl(saved);

  const envCandidates = [
    "DATABASE_PUBLIC_URL",
    "DATABASE_URL",
    "POSTGRES_URL",
    "DATABASE_PRIVATE_URL",
    "POSTGRES_PRIVATE_URL",
  ]
    .map((key) => firstEnvUrl([key]))
    .filter(Boolean)
    .map(normalizeDatabaseUrl);

  const publicish = envCandidates.find((u) => !isPrivateRailwayUrl(u));
  if (publicish) return publicish;
  return envCandidates[0] || "";
}

export function runtimeDbEnvKeys(): string[] {
  const names = new Set<string>();
  if (urlOverride) names.add("DATABASE_URL(memory)");
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
