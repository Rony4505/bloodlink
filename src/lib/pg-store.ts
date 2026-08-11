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
    // Force no cert verification — Railway TCP proxy / postgres-ssl use self-signed certs.
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 15_000,
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
      await p.query(`
        CREATE TABLE IF NOT EXISTS bloodlink_uploads (
          name TEXT PRIMARY KEY,
          content_type TEXT NOT NULL,
          data BYTEA NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  const existing = await getPool().query<{
    donor_count: number;
  }>(
    `SELECT COALESCE(jsonb_array_length(data->'donors'), 0)::int AS donor_count
     FROM bloodlink_store WHERE id = 1`,
  );
  const existingCount = existing.rows[0]?.donor_count ?? 0;
  const nextCount = Array.isArray(db.donors) ? db.donors.length : 0;

  // Never replace a populated donor registry with an empty one.
  if (existingCount > 0 && nextCount === 0) {
    throw new Error(
      `[bloodlink] Refusing to overwrite Postgres donors (${existingCount}) with empty data`,
    );
  }

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
      help = `${message}. Railway uses a self-signed DB certificate — redeploy the latest BloodLink build, then Save the URL again.`;
    }
    return { ok: false, error: help, host };
  }
}

export async function saveUploadToPostgres(
  name: string,
  contentType: string,
  data: Buffer,
): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  try {
    await ensureTable();
    await getPool().query(
      `
        INSERT INTO bloodlink_uploads (name, content_type, data, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (name) DO UPDATE
        SET content_type = EXCLUDED.content_type,
            data = EXCLUDED.data,
            created_at = NOW()
      `,
      [name, contentType, data],
    );
    return true;
  } catch (err) {
    console.error("[bloodlink] upload postgres save failed", err);
    return false;
  }
}

export async function loadUploadFromPostgres(
  name: string,
): Promise<{ contentType: string; data: Buffer } | null> {
  if (!hasDatabaseUrl()) return null;
  try {
    await ensureTable();
    const result = await getPool().query<{
      content_type: string;
      data: Buffer;
    }>("SELECT content_type, data FROM bloodlink_uploads WHERE name = $1", [
      name,
    ]);
    const row = result.rows[0];
    if (!row) return null;
    const buf = Buffer.isBuffer(row.data)
      ? row.data
      : Buffer.from(row.data as unknown as ArrayBuffer);
    return { contentType: row.content_type, data: buf };
  } catch (err) {
    console.error("[bloodlink] upload postgres load failed", err);
    return null;
  }
}
