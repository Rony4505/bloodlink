import { existsSync, readFileSync } from "fs";

const DB_URL_FILE = "/tmp/bloodlink_database_url";
const DB_FLAG_FILE = "/tmp/bloodlink_db_flag";

/**
 * Next.js can strip process.env at build/bundle time.
 * Docker entrypoint writes the real Railway DATABASE_URL to a temp file.
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

function readFileEnv(): string {
  try {
    if (!existsSync(DB_URL_FILE)) return "";
    return readFileSync(DB_URL_FILE, "utf8").trim();
  } catch {
    return "";
  }
}

export function runtimeEnv(name: string): string {
  const fromFile =
    name === "DATABASE_URL" ||
    name === "DATABASE_PRIVATE_URL" ||
    name === "POSTGRES_URL" ||
    name === "POSTGRES_PRIVATE_URL"
      ? readFileEnv()
      : "";
  if (fromFile) return fromFile;

  const fromProcess = readProcessEnv(name);
  if (fromProcess) return fromProcess;

  const fromProc = readProcEnviron()[name];
  return (fromProc || "").trim();
}

export function runtimeDbUrl(): string {
  const fromFile = readFileEnv();
  if (fromFile) return fromFile;

  const keys = [
    "DATABASE_URL",
    "DATABASE_PRIVATE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRIVATE_URL",
  ];
  for (const key of keys) {
    const value = runtimeEnv(key);
    if (value) return value;
  }
  return "";
}

export function runtimeDbEnvKeys(): string[] {
  const names = new Set<string>();
  if (readFileEnv()) names.add("DATABASE_URL(file)");
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
  try {
    if (!existsSync(DB_FLAG_FILE)) return "missing";
    const value = readFileSync(DB_FLAG_FILE, "utf8").trim();
    return value === "1" ? "1" : "0";
  } catch {
    return "missing";
  }
}
