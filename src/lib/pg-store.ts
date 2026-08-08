import { Pool } from "pg";
import { runtimeDbEnvKeys, runtimeDbUrl } from "./runtime-env";
import type { DatabaseShape } from "./types";

let pool: Pool | null = null;
let tableReady: Promise<void> | null = null;

export function getDatabaseUrl(): string {
  return runtimeDbUrl();
}

export function hasDatabaseUrl(): boolean {
  return getDatabaseUrl().length > 0;
}

export function listDbEnvKeys(): string[] {
  return runtimeDbEnvKeys();
}

function getPool(): Pool {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
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

export async function saveDbToPostgres(
  db: DatabaseShape,
  options: { allowEmptyDonors?: boolean } = {},
): Promise<void> {
  await ensureTable();
  const result = await getPool().query(
    `
      INSERT INTO bloodlink_store (id, data, updated_at)
      VALUES (1, $1::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = NOW()
      WHERE $2::boolean = true
         OR COALESCE(jsonb_array_length(bloodlink_store.data->'donors'), 0) = 0
         OR COALESCE(jsonb_array_length(EXCLUDED.data->'donors'), 0) > 0
    `,
    [JSON.stringify(db), Boolean(options.allowEmptyDonors)],
  );
  // When the WHERE clause blocks an empty overwrite, UPDATE affects 0 rows.
  if (
    !options.allowEmptyDonors &&
    (db.donors?.length ?? 0) === 0 &&
    result.rowCount === 0
  ) {
    throw new Error(
      "[bloodlink] Refusing to overwrite Postgres store with empty donor list",
    );
  }
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
