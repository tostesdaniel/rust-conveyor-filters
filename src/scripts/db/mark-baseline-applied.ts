import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

import journal from "../../db/migrations/meta/_journal.json";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "src/db/migrations");
const BASELINE_TAG_PREFIX = "0000";

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const entries = (journal as { entries: JournalEntry[] }).entries;
    const baseline = entries.filter((e) =>
      e.tag.startsWith(BASELINE_TAG_PREFIX),
    );

    if (baseline.length === 0) {
      console.log(
        "No baseline migration entries found in journal. Nothing to do.",
      );
      return;
    }

    for (const entry of baseline) {
      const sqlPath = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
      const sql = readFileSync(sqlPath, "utf8");
      const hash = createHash("sha256").update(sql).digest("hex");

      const { rowCount } = await client.query(
        `SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1`,
        [hash],
      );

      if (rowCount && rowCount > 0) {
        console.log(
          `Baseline ${entry.tag} already marked as applied. Skipping.`,
        );
        continue;
      }

      await client.query(
        `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
        [hash, entry.when],
      );
      console.log(
        `Marked ${entry.tag} as applied (hash=${hash.slice(0, 12)}...).`,
      );
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
