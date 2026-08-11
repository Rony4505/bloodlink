FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Default build targets BloodLink. Fashion service overrides via Railway build args.
ARG APP_MODE=fashion
ARG NEXT_PUBLIC_SITE_URL=https://smartcraftcorner.up.railway.app
ENV APP_MODE=$APP_MODE
ENV NEXT_PUBLIC_APP_MODE=$APP_MODE
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN npm run build \
  && mkdir -p .next/standalone/node_modules \
  && cp -R node_modules/pg .next/standalone/node_modules/ \
  && cp -R node_modules/pg-cloudflare .next/standalone/node_modules/ 2>/dev/null || true \
  && cp -R node_modules/pg-connection-string .next/standalone/node_modules/ \
  && cp -R node_modules/pg-pool .next/standalone/node_modules/ \
  && cp -R node_modules/pg-protocol .next/standalone/node_modules/ \
  && cp -R node_modules/pg-types .next/standalone/node_modules/ \
  && cp -R node_modules/pgpass .next/standalone/node_modules/ \
  && cp -R node_modules/postgres-array .next/standalone/node_modules/ \
  && cp -R node_modules/postgres-bytea .next/standalone/node_modules/ \
  && cp -R node_modules/postgres-date .next/standalone/node_modules/ \
  && cp -R node_modules/postgres-interval .next/standalone/node_modules/ \
  && cp -R node_modules/xtend .next/standalone/node_modules/ \
  && cp -R node_modules/split2 .next/standalone/node_modules/

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATA_DIR=/app/data
ENV APP_MODE=fashion
ENV NEXT_PUBLIC_APP_MODE=fashion
ENV NEXT_PUBLIC_SITE_URL=https://smartcraftcorner.up.railway.app

RUN apk add --no-cache su-exec \
  && addgroup -S nodejs && adduser -S nextjs -G nodejs \
  && mkdir -p /app/data && chown -R nextjs:nodejs /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Stay root so entrypoint can chown the Railway volume, then drop to nextjs.
USER root
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["/app/docker-entrypoint.sh"]
