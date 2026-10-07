import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

const MIGRATION_LOCK_KEY = 7_106_318_544;

export async function runMigrations() {
  const client = new Client({ connectionString: process.env.DATABASE_URL! });
  await client.connect();

  try {
    await client.query("select pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    await migrate(drizzle({ client }), { migrationsFolder });
  } finally {
    await client
      .query("select pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY])
      .catch(() => {});
    await client.end();
  }
}
