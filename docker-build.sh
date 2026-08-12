#!/bin/sh
set -eu

# Railway injects service variables during Docker build.
# Smart craft service must set APP_MODE=fashion in Railway Variables.
APP_MODE="${APP_MODE:-bloodlink}"
NEXT_PUBLIC_APP_MODE="${NEXT_PUBLIC_APP_MODE:-$APP_MODE}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://bloodlinkbd.org}"

export APP_MODE NEXT_PUBLIC_APP_MODE NEXT_PUBLIC_SITE_URL
export NEXT_TELEMETRY_DISABLED=1

echo "[docker-build] APP_MODE=${APP_MODE}"
echo "[docker-build] NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}"

npm run build

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
