#!/usr/bin/env node
/**
 * Export live BloodLink Postgres database to JSON (Admin backup format).
 *
 * Usage (Railway → Postgres → DATABASE_PUBLIC_URL):
 *   export DATABASE_PUBLIC_URL="postgresql://..."
 *   node scripts/export-live-postgres-backup.mjs
 */

import { writeFileSync } from "fs";
import pg from "pg";

const url =
  process.env.DATABASE_PUBLIC_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  "";

if (!url) {
  console.error(
    "Set DATABASE_PUBLIC_URL or DATABASE_URL (Railway Postgres connection string).",
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  const { rows } = await pool.query(
    "SELECT data FROM bloodlink_store WHERE id = 1",
  );
  if (!rows.length || !rows[0]?.data) {
    console.error("No bloodlink_store row found in Postgres.");
    process.exit(1);
  }

  const snapshot = rows[0].data;
  const stamp = new Date().toISOString().slice(0, 10);
  const outFile = `bloodlink-live-backup-${stamp}.json`;
  writeFileSync(outFile, JSON.stringify(snapshot, null, 2), "utf-8");

  console.log(`Saved: ${outFile}`);
  console.log(`Donors: ${snapshot.donors?.length ?? 0}`);
  console.log(`Volunteers: ${snapshot.volunteers?.length ?? 0}`);
  console.log(`Posts: ${snapshot.posts?.length ?? 0}`);
} finally {
  await pool.end();
}
