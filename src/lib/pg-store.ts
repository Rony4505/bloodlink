import { Pool } from "pg";
import type { DatabaseShape } from "./types";

let pool: Pool | null = null;
let tableReady: Promise<void> | null = null;

/** Read at runtime (avoid build-time env inlining). */
export function getDatabaseUrl(): string {
  const env = process.env;
  const candidates = [
    env["DATABASE_URL"],
    env["DATABASE_PRIVATE_URL"],
    env["POSTGRES_URL"],
    env["POSTGRES_PRIVATE_URL"],
    env["database_url"],
  ];
  for (const value of candidates) {
    if (value && value.trim()) return value.trim();
  }
  return "";
}

export function hasDatabaseUrl(): boolean {
  return getDatabaseUrl().length > 0;
}

/** Env key names only — never values — for Railway debugging. */
export function listDbEnvKeys(): string[] {
  return Object.keys(process.env)
    .filter((key) => /database|postgres|^pg/i.test(key))
    .sort();
}

function getPool(): Pool {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({
      connectionString,
      ssl:
        process.env["PGSSL"] === "false"
          ? undefined
          : { rejectUnauthorized: false },
      max: 5,
    });
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
}> {
  try {
    await ensureTable();
    await getPool().query("SELECT 1");
    return { ok: true, error: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Postgres error",
    };
  }
}
