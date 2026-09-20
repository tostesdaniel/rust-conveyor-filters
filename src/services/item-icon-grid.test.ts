import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { buildIconGrid, gridSize, type GridEntry } from "./item-icon-grid";

const SHORTNAMES = [
  "gears",
  "tarp",
  "sheetmetal",
  "fuse",
  "roadsigns",
  "metalspring",
  "techparts",
  "sewingkit",
  "smgbody",
];

function entries(kind: GridEntry["kind"], count: number): GridEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    shortname: SHORTNAMES[i % SHORTNAMES.length],
    kind,
  }));
}

async function size(grid: Buffer | null) {
  const { width, height } = await sharp(grid!).metadata();
  return { width, height };
}

describe("buildIconGrid", () => {
  it("gives each category its own row", async () => {
    const grid = await buildIconGrid([
      ...entries("added", 3),
      ...entries("removed", 1),
      ...entries("redrawn", 2),
    ]);

    expect(await size(grid)).toEqual(gridSize(3, 3));
  });

  it("leaves no gap for a category with nothing in it", async () => {
    const grid = await buildIconGrid(entries("redrawn", 2));

    expect(await size(grid)).toEqual(gridSize(2, 1));
  });

  it("keeps merges on the same row as the rest of the removals", async () => {
    const grid = await buildIconGrid([
      ...entries("removed", 2),
      ...entries("merged", 2),
    ]);

    expect(await size(grid)).toEqual(gridSize(4, 1));
  });

  it("caps redrawn so a repaint build can't crowd out the new items", async () => {
    const grid = await buildIconGrid([
      ...entries("added", 2),
      ...entries("redrawn", 40),
    ]);

    // 16 redrawn over two rows of eight, under the two-wide added row.
    expect(await size(grid)).toEqual(gridSize(8, 3));
  });

  it("wraps a category past eight onto the next row", async () => {
    const grid = await buildIconGrid(entries("added", 9));

    expect(await size(grid)).toEqual(gridSize(8, 2));
  });

  it("is null when none of the icons are on disk", async () => {
    const grid = await buildIconGrid([
      { shortname: "not.a.real.item", kind: "added" },
    ]);

    expect(grid).toBeNull();
  });
});
