FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
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

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["sh", "-c", "node -e \"const fs=require('fs'); let ok=Boolean((process.env.DATABASE_URL||process.env.DATABASE_PRIVATE_URL||'').trim()); if(!ok){try{ok=fs.readFileSync('/proc/self/environ','utf8').includes('DATABASE_URL=')}catch(e){}} console.log('[bloodlink] db url present:', ok);\" && node server.js"]
