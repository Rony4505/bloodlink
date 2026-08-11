#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/app/data}"
PERSIST_FILE="${DATA_DIR}/.database_url"
FLAG_FILE="/tmp/bloodlink_database_url"
FLAG_META="/tmp/bloodlink_db_flag"

mkdir -p "$DATA_DIR" 2>/dev/null || true

# Railway volumes often mount as root-owned; fix before dropping privileges.
if [ "$(id -u)" = "0" ]; then
  chown -R nextjs:nodejs "$DATA_DIR" 2>/dev/null || true
  chmod -R u+rwX "$DATA_DIR" 2>/dev/null || true
fi

is_private() {
  printf '%s' "$1" | grep -qi 'railway\.internal'
}

# Collect candidates (owner paste first — never let private env wipe a public saved URL)
SAVED=""
if [ -f "$PERSIST_FILE" ]; then
  SAVED=$(tr -d '\r\n' < "$PERSIST_FILE" 2>/dev/null || true)
fi

PUBLIC_ENV="${DATABASE_PUBLIC_URL:-}"
ENV_URL="${DATABASE_URL:-}"
if [ -z "$ENV_URL" ]; then
  ENV_URL="${POSTGRES_URL:-}"
fi
if [ -z "$ENV_URL" ]; then
  ENV_URL="${DATABASE_PRIVATE_URL:-}"
fi
if [ -z "$ENV_URL" ]; then
  ENV_URL="${POSTGRES_PRIVATE_URL:-}"
fi

URL=""
# 1) Owner-saved public URL
if [ -n "$SAVED" ] && ! is_private "$SAVED"; then
  URL="$SAVED"
  echo "[bloodlink] using owner-saved DATABASE_PUBLIC_URL from ${PERSIST_FILE}"
fi
# 2) Railway DATABASE_PUBLIC_URL
if [ -z "$URL" ] && [ -n "$PUBLIC_ENV" ] && ! is_private "$PUBLIC_ENV"; then
  URL="$PUBLIC_ENV"
  echo "[bloodlink] using DATABASE_PUBLIC_URL from environment"
fi
# 3) Other env URL if not private
if [ -z "$URL" ] && [ -n "$ENV_URL" ] && ! is_private "$ENV_URL"; then
  URL="$ENV_URL"
  echo "[bloodlink] using public DATABASE_URL from environment"
fi
# 4) Saved private (last resort)
if [ -z "$URL" ] && [ -n "$SAVED" ]; then
  URL="$SAVED"
  echo "[bloodlink] warning: using private saved URL (prefer DATABASE_PUBLIC_URL)"
fi
# 5) Env private (last resort)
if [ -z "$URL" ] && [ -n "$ENV_URL" ]; then
  URL="$ENV_URL"
  echo "[bloodlink] warning: using private railway.internal URL — paste DATABASE_PUBLIC_URL in Owner Settings"
fi

if [ -n "$URL" ]; then
  printf '%s' "$URL" > "$FLAG_FILE"
  printf '1' > "$FLAG_META"
  # Persist only non-private URLs so restarts keep a working public connection
  if ! is_private "$URL"; then
    printf '%s' "$URL" > "$PERSIST_FILE" 2>/dev/null || true
  fi
  export DATABASE_URL="$URL"
  export DATABASE_PUBLIC_URL="$URL"
  echo "[bloodlink] db url present: true"
else
  rm -f "$FLAG_FILE"
  printf '0' > "$FLAG_META"
  echo "[bloodlink] db url present: false"
  echo "[bloodlink] hint: paste DATABASE_PUBLIC_URL (proxy.rlwy.net) in Owner panel → Storage"
fi

echo "[bloodlink] DATA_DIR=${DATA_DIR}"

if [ "$(id -u)" = "0" ]; then
  exec su-exec nextjs node server.js
fi

exec node server.js
