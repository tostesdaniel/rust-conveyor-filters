import { describe, expect, it } from "vitest";

import type { ItemWithFields } from "@/types/item";
import { exportConveyorFilter } from "@/utils/export-conveyor-filter";
import { normalizeFilterData } from "@/utils/normalize-filter-data";

/**
 * The in-editor export button (new-filter, remix, and edit pages) exports live
 * react-hook-form state, which it first runs through normalizeFilterData. The
 * adapter's job is to reshape that form state into exactly what
 * exportConveyorFilter reads — `item.shortname` for items and `category.id` for
 * categories — so both kinds of rows export with their real values. These tests
 * pin that contract, including a round-trip through the exporter to prove the
 * two pieces line up end to end.
 */

// react-hook-form carries whatever fields were appended; these mirror the two
// row variants the form actually holds. Cast because ItemWithFields is a wider
// DB-derived type than what the form keeps in state.
function itemField(shortname: string, extra: Record<string, unknown> = {}) {
  return {
    itemId: 1,
    name: shortname,
    shortname,
    imagePath: `items/${shortname}`,
    max: 0,
    buffer: 0,
    min: 0,
    ...extra,
  } as unknown as ItemWithFields;
}

function categoryField(id: number, extra: Record<string, unknown> = {}) {
  return {
    categoryId: id,
    name: `category-${id}`,
    max: 0,
    buffer: 0,
    min: 0,
    ...extra,
  } as unknown as ItemWithFields;
}

describe("normalizeFilterData", () => {
  it("maps an item row to { item: { shortname }, category: null }", () => {
    const [row] = normalizeFilterData([itemField("metal.ore")]);

    expect(row.item).toEqual({ shortname: "metal.ore" });
    expect(row.category).toBeNull();
  });

  it("maps a category row to { category: { id }, item: null }", () => {
    const [row] = normalizeFilterData([categoryField(6)]);

    expect(row.category).toEqual({ id: 6 });
    expect(row.item).toBeNull();
  });

  it("keeps category id 0 (a valid category) rather than dropping it", () => {
    const [row] = normalizeFilterData([categoryField(0)]);

    expect(row.category).toEqual({ id: 0 });
  });

  describe("round-trips through exportConveyorFilter without blanks", () => {
    it("carries item shortnames from editor state through to the export", () => {
      // An item's shortname is what the game format keys on, so a form row that
      // holds a shortname must surface it as TargetItemName in the export.
      const filter = normalizeFilterData([
        itemField("smg.2"),
        itemField("shotgun.double"),
      ]);

      const parsed = JSON.parse(exportConveyorFilter(filter));

      expect(parsed.map((r: { TargetItemName: string }) => r.TargetItemName)).toEqual([
        "smg.2",
        "shotgun.double",
      ]);
    });

    it("carries category ids through to the export in mixed item/category filters", () => {
      // The adapter maps each category row to `category.id`, the shape the
      // exporter reads, so categories land as a numeric TargetCategory while
      // interleaved items keep their names — order preserved across both.
      const filter = normalizeFilterData([
        itemField("gears"),
        categoryField(1),
        itemField("rope"),
        categoryField(0),
      ]);

      const parsed = JSON.parse(exportConveyorFilter(filter));

      expect(
        parsed.map((r: { TargetItemName: string; TargetCategory: number | null }) => ({
          name: r.TargetItemName,
          category: r.TargetCategory,
        })),
      ).toEqual([
        { name: "gears", category: null },
        { name: "", category: 1 },
        { name: "rope", category: null },
        { name: "", category: 0 },
      ]);
    });
  });
});
