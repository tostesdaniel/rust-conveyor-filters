import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { filterItemsOrderBy } from "@/data/filter-items-order";
import { describe, expect, it } from "vitest";

describe("filterItemsOrderBy", () => {
  it("orders by id first, then createdAt (insertion order)", () => {
    const id = { column: "id" };
    const createdAt = { column: "createdAt" };

    // The relational query builder calls the callback with the table's columns.
    const result = filterItemsOrderBy({
      id: id as never,
      createdAt: createdAt as never,
    });

    expect(result).toEqual([id, createdAt]);
  });
});

/**
 * Recursively collect every `.ts` data-layer file, skipping tests.
 */
function collectDataFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectDataFiles(full);
    if (!entry.name.endsWith(".ts")) return [];
    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".spec.ts")) {
      return [];
    }
    return [full];
  });
}

/**
 * Given source text and the index just past a `filterItems: {`, return the
 * body of that object literal up to its matching closing brace.
 */
function objectBodyAfter(source: string, openBraceIndex: number): string {
  let depth = 1;
  let i = openBraceIndex + 1;
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") depth--;
  }
  return source.slice(openBraceIndex + 1, i - 1);
}

describe("data-layer filterItems ordering is consistent everywhere", () => {
  const dataDir = join(process.cwd(), "src", "data");
  const files = collectDataFiles(dataDir);

  it("has data files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [f.slice(dataDir.length + 1), f] as const))(
    "%s: every filterItems fetch uses filterItemsOrderBy",
    (_label, file) => {
      const source = readFileSync(file, "utf8");
      const marker = "filterItems: {";

      let searchFrom = 0;
      while (true) {
        const idx = source.indexOf(marker, searchFrom);
        if (idx === -1) break;

        const openBrace = idx + marker.length - 1;
        const body = objectBodyAfter(source, openBrace);

        // Any relational load that also joins `item`/`category` is a display or
        // export read, so it must pin the row order via the shared helper. That
        // is what guarantees a filter looks identical everywhere it's shown or
        // copied. (Loads without nested rows aren't display reads and are skipped.)
        if (body.includes("with:")) {
          expect(
            body,
            `A filterItems fetch in ${file} is missing "orderBy: filterItemsOrderBy". ` +
              `Add it so this read returns items in the same stable order as every ` +
              `other display/export path.`,
          ).toContain("orderBy: filterItemsOrderBy");
        }

        searchFrom = idx + marker.length;
      }
    },
  );
});
