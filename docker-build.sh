#!/bin/sh
set -e

# Railway injects service variables during Docker build.
# Auto-detect Smart craft service name when APP_MODE is not set.
APP_MODE="${APP_MODE:-bloodlink}"
NEXT_PUBLIC_APP_MODE="${NEXT_PUBLIC_APP_MODE:-$APP_MODE}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://bloodlinkbd.org}"

case "${RAILWAY_SERVICE_NAME:-}" in
  *craft*|*Craft*|smart-craft-corner)
    APP_MODE=fashion
    NEXT_PUBLIC_APP_MODE=fashion
    NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://smartcraftcorner.up.railway.app}"
    ;;
esac

export APP_MODE NEXT_PUBLIC_APP_MODE NEXT_PUBLIC_SITE_URL
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

echo "[docker-build] RAILWAY_SERVICE_NAME=${RAILWAY_SERVICE_NAME:-unknown}"
echo "[docker-build] APP_MODE=${APP_MODE}"
echo "[docker-build] NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}"

npm run build
test -d .next/standalone || (echo "[docker-build] missing .next/standalone" && exit 1)

if [ "$APP_MODE" = "fashion" ]; then
  echo "[docker-build] fashion mode — skipping Postgres bundle copy"
  exit 0
fi

mkdir -p .next/standalone/node_modules
for pkg in \
  pg \
  pg-connection-string \
  pg-pool \
  pg-protocol \
  pg-types \
  pgpass \
  postgres-array \
  postgres-bytea \
  postgres-date \
  postgres-interval \
  xtend \
  split2
do
  if [ -d "node_modules/$pkg" ]; then
    cp -R "node_modules/$pkg" .next/standalone/node_modules/ || true
  fi
done

if [ -d node_modules/pg-cloudflare ]; then
  cp -R node_modules/pg-cloudflare .next/standalone/node_modules/ || true
fi
