#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

DEV_DSN='postgresql://postgres:rcfisawesome@db:5432/postgres'

# Windows/macOS bind mounts arrive with a uid git won't accept as the owner.
git config --global --add safe.directory "$PWD" || true

# .env.local outranks .env, so don't write a second file saying otherwise.
if [ ! -f .env ] && [ ! -f .env.local ]; then
  sed -E "s#^DATABASE_URL=.*#DATABASE_URL=\"${DEV_DSN}\"#" .env.example > .env
  echo "==> wrote .env from .env.example (DATABASE_URL set to the compose db)"
fi

echo "==> installing dependencies"
bun install --frozen-lockfile

echo "==> pushing schema to postgres"
bun run db:push

# Placeholder Clerk keys give a 500 on every route, not a degraded app.
clerk_ready=1
for var in CLERK_SECRET_KEY NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY; do
  value="$(grep -sh "^${var}=" .env.local .env | head -n1 | cut -d= -f2- | tr -d '"' || true)"
  case "$value" in
  "" | your_*) clerk_ready=0 ;;
  esac
done

cat <<'EOF'

Ready.

  bun dev              http://localhost:3000
  bun run db:studio    https://local.drizzle.studio
  bun run test         vitest ("bun test" is Bun's own runner)

EOF

if [ "$clerk_ready" -eq 0 ]; then
  cat <<'EOF'
One thing left: Clerk. Auth middleware runs on almost every route, so the app
will error until real keys are in .env:

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...

Free dev instance: https://dashboard.clerk.com/sign-up - see CONTRIBUTING.md
for the two settings that matter. Then seed the database:

  bun run db:seed

EOF
fi
