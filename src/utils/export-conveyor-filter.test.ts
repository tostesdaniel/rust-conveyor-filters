import { exportConveyorFilter } from "@/utils/export-conveyor-filter";
import { describe, expect, it } from "vitest";

import type { FilterItemDTO } from "@/types/filter";

/**
 * Builders that mirror the two kinds of rows a filter can hold: a game item
 * (has `item`, no `category`) or a whole in-game category (has `category`, no
 * `item`). Keeping them terse makes the ordering assertions below readable.
 */
function itemRow(
  shortname: string,
  overrides: Partial<FilterItemDTO> = {},
): FilterItemDTO {
  return {
    item: { name: shortname, imagePath: `items/${shortname}`, shortname },
    category: null,
    max: 0,
    buffer: 0,
    min: 0,
    ...overrides,
  };
}

function categoryRow(
  id: number,
  overrides: Partial<FilterItemDTO> = {},
): FilterItemDTO {
  return {
    item: null,
    category: { name: `category-${id}`, id },
    max: 0,
    buffer: 0,
    min: 0,
    ...overrides,
  };
}

describe("exportConveyorFilter", () => {
  it("produces valid, 2-space-indented JSON", () => {
    const output = exportConveyorFilter([itemRow("gears")]);

    expect(() => JSON.parse(output)).not.toThrow();
    expect(output).toBe(JSON.stringify(JSON.parse(output), null, 2));
  });

  describe("items only", () => {
    it("maps each item to the game shape and keeps input order", () => {
      const filter = [
        itemRow("gears"),
        itemRow("metalpipe"),
        itemRow("cctv.camera"),
        itemRow("targeting.computer"),
        itemRow("rope"),
      ];

      const parsed = JSON.parse(exportConveyorFilter(filter));

      expect(
        parsed.map((r: { TargetItemName: string }) => r.TargetItemName),
      ).toEqual([
        "gears",
        "metalpipe",
        "cctv.camera",
        "targeting.computer",
        "rope",
      ]);
      expect(
        parsed.every(
          (r: { TargetCategory: number | null }) => r.TargetCategory === null,
        ),
      ).toBe(true);
    });

    it("maps a single item's fields exactly", () => {
      const [row] = JSON.parse(
        exportConveyorFilter([
          itemRow("metal.ore", { max: 900, buffer: 5, min: 2 }),
        ]),
      );

      expect(row).toEqual({
        TargetCategory: null,
        MaxAmountInOutput: 900,
        BufferAmount: 5,
        MinAmountInInput: 2,
        IsBlueprint: false,
        TargetItemName: "metal.ore",
      });
    });
  });

  describe("categories only", () => {
    it("maps each category id and keeps input order", () => {
      const filter = [
        categoryRow(1),
        categoryRow(0, { max: 123123 }),
        categoryRow(6),
        categoryRow(9),
        categoryRow(16),
      ];

      const parsed = JSON.parse(exportConveyorFilter(filter));

      expect(
        parsed.map((r: { TargetCategory: number | null }) => r.TargetCategory),
      ).toEqual([1, 0, 6, 9, 16]);
      expect(
        parsed.every(
          (r: { TargetItemName: string }) => r.TargetItemName === "",
        ),
      ).toBe(true);
    });

    it("keeps category id 0, since 0 is a real category and null means 'no category'", () => {
      // The two values mean different things in the game format: a numeric id
      // (including 0) selects a category, null marks an item row. So id 0 must
      // survive as 0 and never be conflated with null.
      const [row] = JSON.parse(exportConveyorFilter([categoryRow(0)]));

      expect(row.TargetCategory).toBe(0);
      expect(row.TargetItemName).toBe("");
    });
  });

  describe("items and categories", () => {
    it("preserves the exact interleaved order of items and categories", () => {
      const filter = [
        itemRow("gears"),
        categoryRow(1),
        itemRow("cctv.camera"),
        categoryRow(0),
        itemRow("rope"),
      ];

      const parsed = JSON.parse(exportConveyorFilter(filter));

      expect(
        parsed.map(
          (r: { TargetItemName: string; TargetCategory: number | null }) => ({
            name: r.TargetItemName,
            category: r.TargetCategory,
          }),
        ),
      ).toEqual([
        { name: "gears", category: null },
        { name: "", category: 1 },
        { name: "cctv.camera", category: null },
        { name: "", category: 0 },
        { name: "rope", category: null },
      ]);
    });
  });

  describe("ordering is a faithful passthrough", () => {
    it("does not reorder, sort, or dedupe the input array", () => {
      const filter = [
        itemRow("wood"),
        itemRow("stones"),
        itemRow("metal.fragments"),
        itemRow("wood"), // duplicate shortname must survive
        itemRow("cloth"),
      ];

      const names = JSON.parse(exportConveyorFilter(filter)).map(
        (r: { TargetItemName: string }) => r.TargetItemName,
      );

      expect(names).toEqual([
        "wood",
        "stones",
        "metal.fragments",
        "wood",
        "cloth",
      ]);
    });

    it("emits rows in the same count and order as the input", () => {
      const filter = Array.from({ length: 25 }, (_, i) => itemRow(`item-${i}`));

      const names = JSON.parse(exportConveyorFilter(filter)).map(
        (r: { TargetItemName: string }) => r.TargetItemName,
      );

      expect(names).toEqual(filter.map((_, i) => `item-${i}`));
    });
  });

  describe("edge cases", () => {
    it("returns an empty JSON array for no items", () => {
      expect(exportConveyorFilter([])).toBe("[]");
    });

    it("falls back to empty name / null category when both are missing", () => {
      const [row] = JSON.parse(
        exportConveyorFilter([
          { item: null, category: null, max: 0, buffer: 0, min: 0 },
        ]),
      );

      expect(row.TargetItemName).toBe("");
      expect(row.TargetCategory).toBe(null);
    });
  });
});
