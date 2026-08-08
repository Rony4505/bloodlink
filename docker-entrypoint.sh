#!/bin/sh
set -eu

URL="${DATABASE_URL:-}"
if [ -z "$URL" ]; then
  URL="${DATABASE_PRIVATE_URL:-}"
fi
if [ -z "$URL" ]; then
  URL="${POSTGRES_URL:-}"
fi
if [ -z "$URL" ]; then
  URL="${POSTGRES_PRIVATE_URL:-}"
fi

FLAG_FILE="/tmp/bloodlink_database_url"
FLAG_META="/tmp/bloodlink_db_flag"

if [ -n "$URL" ]; then
  printf '%s' "$URL" > "$FLAG_FILE"
  printf '1' > "$FLAG_META"
  echo "[bloodlink] db url present: true"
else
  rm -f "$FLAG_FILE"
  printf '0' > "$FLAG_META"
  echo "[bloodlink] db url present: false"
  echo "[bloodlink] CRITICAL: without DATABASE_URL, website edits/redeploys erase donor data"
  echo "[bloodlink] hint: Railway → bloodlink Variables → Add Reference → Postgres DATABASE_URL → Deploy"
fi

if [ -n "${RAILWAY_VOLUME_MOUNT_PATH:-}" ]; then
  echo "[bloodlink] volume mount: ${RAILWAY_VOLUME_MOUNT_PATH}"
fi

exec node server.js
