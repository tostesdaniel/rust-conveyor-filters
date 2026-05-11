import fs from "fs/promises";
import { glob } from "node:fs/promises";
import path from "node:path";

import type { GameItem } from "@/types/gameItem";

const ITEMS_SINK_DIR = path.join(__dirname, "items-sink");

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Maps sink JSON to DB row fields. Keep in sync with `normalizeItem` in
 * `update-items.ts`.
 */
function rowFromGameItem(item: GameItem): {
  itemid: number;
  shortname: string;
  name: string;
  category: string;
  image_path: string;
} {
  return {
    itemid: item.itemid,
    shortname: item.shortname,
    name: item.Name,
    category: item.Category,
    image_path: item.shortname,
  };
}

function valuesTuple(row: ReturnType<typeof rowFromGameItem>): string {
  return `(${row.itemid}, ${sqlString(row.shortname)}, ${sqlString(row.name)}, ${sqlString(row.category)}, ${sqlString(row.image_path)})`;
}

function assertNonEmptyString(
  value: unknown,
  field: string,
  filePath: string,
): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${filePath}: invalid or missing string field "${field}"`);
  }
}

function parseGameItem(json: unknown, filePath: string): GameItem {
  if (typeof json !== "object" || json === null) {
    throw new Error(`${filePath}: root JSON value must be an object`);
  }

  const o = json as Record<string, unknown>;

  if (typeof o.itemid !== "number" || !Number.isInteger(o.itemid)) {
    throw new Error(`${filePath}: invalid or missing integer field "itemid"`);
  }

  assertNonEmptyString(o.shortname, "shortname", filePath);
  assertNonEmptyString(o.Name, "Name", filePath);
  assertNonEmptyString(o.Category, "Category", filePath);

  return json as GameItem;
}

async function main() {
  const separate = process.argv.includes("--separate");

  const relativePaths: string[] = [];
  for await (const file of glob("**/*.json", { cwd: ITEMS_SINK_DIR })) {
    relativePaths.push(file);
  }

  relativePaths.sort((a, b) => a.localeCompare(b, "en"));

  if (relativePaths.length === 0) {
    console.error("No JSON files found in items-sink.");
    process.exit(1);
  }

  const rows: ReturnType<typeof rowFromGameItem>[] = [];

  for (const rel of relativePaths) {
    const filePath = path.join(ITEMS_SINK_DIR, rel);
    let raw: string;
    try {
      raw = await fs.readFile(filePath, "utf-8");
    } catch (err) {
      console.error(`${filePath}: failed to read file`, err);
      process.exit(1);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch (err) {
      console.error(`${filePath}: invalid JSON`, err);
      process.exit(1);
    }

    const item = parseGameItem(parsed, filePath);
    rows.push(rowFromGameItem(item));
  }

  const columns =
    "INSERT INTO items (itemid, shortname, name, category, image_path) VALUES ";

  if (separate) {
    for (const row of rows) {
      console.log(`${columns}${valuesTuple(row)};`);
    }
  } else {
    console.log(
      `${columns}${rows.map((row) => valuesTuple(row)).join(",\n")};`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
