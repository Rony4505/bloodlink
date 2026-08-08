import { Pool } from "pg";
import {
  databaseUrlHost,
  runtimeDbEnvKeys,
  runtimeDbUrl,
} from "./runtime-env";
import type { DatabaseShape } from "./types";

let pool: Pool | null = null;
let poolUrl: string | null = null;
let tableReady: Promise<void> | null = null;

export function getDatabaseUrl(): string {
  return runtimeDbUrl();
}

export async function resetPgPool(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  }
  pool = null;
  poolUrl = null;
  tableReady = null;
}

export function hasDatabaseUrl(): boolean {
  return getDatabaseUrl().length > 0;
}

export function listDbEnvKeys(): string[] {
  return runtimeDbEnvKeys();
}

function getPool(): Pool {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!pool || poolUrl !== connectionString) {
    if (pool) {
      void pool.end().catch(() => undefined);
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 12_000,
      idleTimeoutMillis: 10_000,
    });
    poolUrl = connectionString;
    tableReady = null;
  }
  return pool;
}

async function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      const p = getPool();
      await p.query(`
        CREATE TABLE IF NOT EXISTS bloodlink_store (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    })().catch((err) => {
      tableReady = null;
      throw err;
    });
  }
  await tableReady;
}

export async function loadDbFromPostgres(): Promise<DatabaseShape | null> {
  await ensureTable();
  const result = await getPool().query<{ data: DatabaseShape }>(
    "SELECT data FROM bloodlink_store WHERE id = 1",
  );
  const row = result.rows[0];
  if (!row?.data) return null;
  return row.data;
}

export async function saveDbToPostgres(db: DatabaseShape): Promise<void> {
  await ensureTable();
  await getPool().query(
    `
      INSERT INTO bloodlink_store (id, data, updated_at)
      VALUES (1, $1::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = NOW()
    `,
    [JSON.stringify(db)],
  );
}

export async function postgresHealth(): Promise<{
  ok: boolean;
  error: string | null;
  host: string;
}> {
  const url = getDatabaseUrl();
  const host = databaseUrlHost(url);
  if (!url) {
    return { ok: false, error: "DATABASE_URL is not set", host: "" };
  }
  try {
    await ensureTable();
    await getPool().query("SELECT 1");
    return { ok: true, error: null, host };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Postgres error";
    let help = message;
    if (/ENOTFOUND|getaddrinfo/i.test(message)) {
      help = `${message}. Host "${host}" was not found — paste DATABASE_PUBLIC_URL (proxy.rlwy.net), not railway.internal.`;
    } else if (/ECONNREFUSED|timeout|Connection terminated/i.test(message)) {
      help = `${message}. Could not reach "${host}". Check the public Postgres URL and that the DB service is running.`;
    } else if (/password|authentication|SASL/i.test(message)) {
      help = `${message}. Wrong password in the URL — copy DATABASE_PUBLIC_URL again from Railway Postgres → Variables.`;
    } else if (/SSL|TLS|self-signed/i.test(message)) {
      help = `${message}. SSL problem talking to "${host}". Re-copy DATABASE_PUBLIC_URL and try again.`;
    }
    return { ok: false, error: help, host };
  }
}
