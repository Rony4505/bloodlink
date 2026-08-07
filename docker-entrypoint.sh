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
  echo "[bloodlink] hint: set DATABASE_URL on the bloodlink service Variables, then redeploy"
fi

exec node server.js
