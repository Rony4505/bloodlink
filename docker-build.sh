#!/bin/sh
set -e

# Railway injects service variables during Docker build.
# Auto-detect Smart craft service name when APP_MODE is not set.
APP_MODE="${APP_MODE:-bloodlink}"
NEXT_PUBLIC_APP_MODE="${NEXT_PUBLIC_APP_MODE:-$APP_MODE}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://bloodlinkbd.org}"

case "${RAILWAY_SERVICE_NAME:-}" in
  *craft*|*Craft*|smart-craft-corner|*smartcraft*|*Smartcraft*)
    APP_MODE=fashion
    NEXT_PUBLIC_APP_MODE=fashion
    NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://smartcraftcorner.up.railway.app}"
    ;;
esac

# Fallback when service name is generic but site URL is Smart craft.
case "${NEXT_PUBLIC_SITE_URL:-}" in
  *smartcraftcorner*)
    APP_MODE=fashion
    NEXT_PUBLIC_APP_MODE=fashion
    ;;
esac

BUILD_ID="${RAILWAY_GIT_COMMIT_SHA:-${BUILD_ID:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}}"

export APP_MODE NEXT_PUBLIC_APP_MODE NEXT_PUBLIC_SITE_URL BUILD_ID
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

echo "[docker-build] RAILWAY_SERVICE_NAME=${RAILWAY_SERVICE_NAME:-unknown}"
echo "[docker-build] APP_MODE=${APP_MODE}"
echo "[docker-build] NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}"
echo "[docker-build] BUILD_ID=${BUILD_ID}"

npm run build
test -d .next/standalone || (echo "[docker-build] missing .next/standalone" && exit 1)
printf '%s' "$BUILD_ID" > /app/.build-id

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
