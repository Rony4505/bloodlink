#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/app/data}"
PERSIST_FILE="${DATA_DIR}/.database_url"
FLAG_FILE="/tmp/bloodlink_database_url"
FLAG_META="/tmp/bloodlink_db_flag"

mkdir -p "$DATA_DIR" 2>/dev/null || true

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
# Owner-saved URL on persistent volume (survives redeploys)
if [ -z "$URL" ] && [ -f "$PERSIST_FILE" ]; then
  URL=$(cat "$PERSIST_FILE")
  echo "[bloodlink] loaded DATABASE_URL from ${PERSIST_FILE}"
fi

if [ -n "$URL" ]; then
  printf '%s' "$URL" > "$FLAG_FILE"
  # Keep a durable copy when volume/data dir is writable
  printf '%s' "$URL" > "$PERSIST_FILE" 2>/dev/null || true
  printf '1' > "$FLAG_META"
  echo "[bloodlink] db url present: true"
else
  rm -f "$FLAG_FILE"
  printf '0' > "$FLAG_META"
  echo "[bloodlink] db url present: false"
  echo "[bloodlink] hint: set DATABASE_URL in Railway OR paste it once in Owner panel → Storage"
fi

exec node server.js
