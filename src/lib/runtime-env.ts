import { readFileSync } from "fs";

/**
 * Next.js can replace process.env.* at build time. On Railway the real
 * DATABASE_URL only exists at container runtime, so we read it indirectly.
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
    // Prevent static inlining of process.env.NAME
    const env = new Function("return process.env")() as NodeJS.ProcessEnv;
    return (env?.[name] || "").trim();
  } catch {
    return "";
  }
}

export function runtimeEnv(name: string): string {
  const fromProcess = readProcessEnv(name);
  if (fromProcess) return fromProcess;
  const fromProc = readProcEnviron()[name];
  return (fromProc || "").trim();
}

export function runtimeDbUrl(): string {
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
