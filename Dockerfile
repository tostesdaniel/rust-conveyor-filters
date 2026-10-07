FROM oven/bun:1.4.2-slim AS deps

WORKDIR /app

COPY package.json bun.lock bunfig.toml ./

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun ci --no-save

FROM oven/bun:1.4.2-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_RYBBIT_HOST
ENV NEXT_PUBLIC_RYBBIT_HOST=$NEXT_PUBLIC_RYBBIT_HOST
ARG NEXT_PUBLIC_COMMIT_SHA
ENV NEXT_PUBLIC_COMMIT_SHA=$NEXT_PUBLIC_COMMIT_SHA
ARG NEXT_PUBLIC_PAYNOW_ENABLED
ENV NEXT_PUBLIC_PAYNOW_ENABLED=$NEXT_PUBLIC_PAYNOW_ENABLED
ARG STEAM_ID
ENV STEAM_ID=$STEAM_ID

RUN --mount=type=secret,id=STEAM_API_KEY \
    STEAM_API_KEY=$(cat /run/secrets/STEAM_API_KEY) \
    bun run build

FROM node:24.15.0-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=768"

COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir .next && chown node:node .next

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/src/db/migrations ./src/db/migrations

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
