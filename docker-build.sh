#!/bin/sh
set -e

NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://bloodlinkbd.org}"
BUILD_ID="${RAILWAY_GIT_COMMIT_SHA:-${BUILD_ID:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}}"

export NEXT_PUBLIC_SITE_URL BUILD_ID
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

echo "[docker-build] RAILWAY_SERVICE_NAME=${RAILWAY_SERVICE_NAME:-unknown}"
echo "[docker-build] NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}"
echo "[docker-build] BUILD_ID=${BUILD_ID}"

npm run build
test -d .next/standalone || (echo "[docker-build] missing .next/standalone" && exit 1)
printf '%s' "$BUILD_ID" > /app/.build-id

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
