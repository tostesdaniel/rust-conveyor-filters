import type { CreateFilterInput } from "@/schemas/filterFormSchema";
import { describe, expect, it } from "vitest";

import { reconcileFilterDraft } from "./filter-draft";

const catalogue = [
  {
    id: 1,
    name: "Metal Ore",
    shortname: "metal.ore",
    imagePath: "metal.ore.png",
    iconVersion: "v2",
  },
  {
    id: 2,
    name: "Sulfur Ore",
    shortname: "sulfur.ore",
    imagePath: "sulfur.ore.png",
    iconVersion: null,
  },
];

function draft(overrides: Partial<CreateFilterInput> = {}): CreateFilterInput {
  return {
    name: "Ores",
    description: "",
    imagePath: "metal.ore.png",
    category: { categoryId: null, subCategoryId: null },
    isPublic: false,
    outputContainer: null,
    items: [],
    ...overrides,
  };
}

const row = { max: 0, buffer: 0, min: 0 };

describe("reconcileFilterDraft", () => {
  it("drops items that are no longer in the catalogue", () => {
    const result = reconcileFilterDraft(
      draft({
        items: [
          { ...row, itemId: 1, name: "Metal Ore", imagePath: "metal.ore.png" },
          { ...row, itemId: 99, name: "Gone", imagePath: "gone.png" },
        ],
      }),
      catalogue,
    );

    expect(result.droppedCount).toBe(1);
    expect(result.values.items).toHaveLength(1);
  });

  it("refreshes kept items from the catalogue", () => {
    const result = reconcileFilterDraft(
      draft({
        items: [
          {
            ...row,
            itemId: 1,
            name: "Old Name",
            imagePath: "old.png",
            iconVersion: "v1",
          },
        ],
      }),
      catalogue,
    );

    expect(result.values.items[0]).toMatchObject({
      itemId: 1,
      name: "Metal Ore",
      shortname: "metal.ore",
      imagePath: "metal.ore.png",
      iconVersion: "v2",
    });
  });

  it("keeps category rows as they are", () => {
    const categoryRow = { ...row, categoryId: 5, name: "Resources" };
    const result = reconcileFilterDraft(
      draft({ items: [categoryRow] }),
      catalogue,
    );

    expect(result.values.items).toEqual([categoryRow]);
    expect(result.droppedCount).toBe(0);
  });

  it("clears a cover image that no longer exists", () => {
    const result = reconcileFilterDraft(
      draft({ imagePath: "gone.png" }),
      catalogue,
    );

    expect(result.values.imagePath).toBe("");
  });

  it("keeps a cover image that still exists", () => {
    const result = reconcileFilterDraft(draft(), catalogue);

    expect(result.values.imagePath).toBe("metal.ore.png");
  });
});
