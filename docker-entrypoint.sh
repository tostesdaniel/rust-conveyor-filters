#!/usr/bin/env sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] DATABASE_URL is not set; refusing to start." >&2
  exit 1
fi

echo "[entrypoint] Marking baseline migration as applied (idempotent)..."
bun run /app/src/scripts/db/mark-baseline-applied.ts

echo "[entrypoint] Applying pending migrations..."
bun run /app/src/scripts/db/migrate.ts

echo "[entrypoint] Starting Next.js server..."
exec bun /app/server.js
