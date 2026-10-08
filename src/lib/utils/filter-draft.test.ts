import type { CreateFilterInput } from "@/schemas/filterFormSchema";
import { describe, expect, it } from "vitest";

import {
  filterDraftBase,
  filterDraftHref,
  filterDraftKey,
  isFilterDraftStale,
  parseFilterDraftKey,
  reconcileFilterDraft,
  type FilterDraftTarget,
} from "./filter-draft";

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

  it("keeps the filter's saved cover even if its item left the game", () => {
    const result = reconcileFilterDraft(
      draft({ imagePath: "gone.png" }),
      catalogue,
      "gone.png",
    );

    expect(result.values.imagePath).toBe("gone.png");
  });

  it("keeps a cover image that still exists", () => {
    const result = reconcileFilterDraft(draft(), catalogue);

    expect(result.values.imagePath).toBe("metal.ore.png");
  });
});

describe("filterDraftBase", () => {
  const itemRow = {
    ...row,
    itemId: 1,
    name: "Metal Ore",
    imagePath: "metal.ore.png",
  };

  it("ignores item names and icons", () => {
    const renamed = { ...itemRow, name: "Renamed", iconVersion: "v9" };

    expect(filterDraftBase(draft({ items: [renamed] }))).toBe(
      filterDraftBase(draft({ items: [itemRow] })),
    );
  });

  it("changes when a setting the draft overwrites changes", () => {
    const before = filterDraftBase(draft({ items: [itemRow] }));

    expect(
      filterDraftBase(draft({ name: "Other", items: [itemRow] })),
    ).not.toBe(before);
    expect(
      filterDraftBase(draft({ items: [{ ...itemRow, max: 10 }] })),
    ).not.toBe(before);
    expect(
      filterDraftBase(
        draft({
          category: { categoryId: 3, subCategoryId: null },
          items: [itemRow],
        }),
      ),
    ).not.toBe(before);
  });

  it("changes when items are reordered", () => {
    const other = { ...row, categoryId: 5, name: "Resources" };

    expect(filterDraftBase(draft({ items: [itemRow, other] }))).not.toBe(
      filterDraftBase(draft({ items: [other, itemRow] })),
    );
  });
});

describe("isFilterDraftStale", () => {
  const metal = {
    ...row,
    itemId: 1,
    name: "Metal Ore",
    imagePath: "metal.ore.png",
  };
  const gone = { ...row, itemId: 99, name: "Gone", imagePath: "gone.png" };

  it("is fresh when the filter hasn't changed", () => {
    const base = filterDraftBase(draft({ items: [metal] }));

    expect(isFilterDraftStale(base, base, catalogue)).toBe(false);
  });

  it("is fresh when the only missing row is an item that is no longer insertable", () => {
    const draftBase = filterDraftBase(draft({ items: [metal, gone] }));
    const base = filterDraftBase(draft({ items: [metal] }));

    expect(isFilterDraftStale(draftBase, base, catalogue)).toBe(false);
  });

  it("is stale when the filter changed since the draft", () => {
    const draftBase = filterDraftBase(draft({ items: [metal, gone] }));
    const base = filterDraftBase(draft({ items: [{ ...metal, max: 10 }] }));

    expect(isFilterDraftStale(draftBase, base, catalogue)).toBe(true);
  });

  it("is stale when the draft has no base", () => {
    const base = filterDraftBase(draft());

    expect(isFilterDraftStale(undefined, base, catalogue)).toBe(true);
  });
});

describe("filter draft keys", () => {
  const targets: FilterDraftTarget[] = [
    { kind: "new" },
    { kind: "remix", filterId: 12 },
    { kind: "edit", filterId: 34 },
  ];

  it.each(targets)("round-trips $kind", (target) => {
    expect(
      parseFilterDraftKey(filterDraftKey("user_1", target), "user_1"),
    ).toEqual(target);
  });

  it("ignores another user's drafts", () => {
    expect(
      parseFilterDraftKey(filterDraftKey("user_2", { kind: "new" }), "user_1"),
    ).toBeNull();
  });

  it("ignores keys that aren't filter drafts", () => {
    expect(parseFilterDraftKey("feedback:user_1", "user_1")).toBeNull();
    expect(parseFilterDraftKey("filter:user_1:edit:abc", "user_1")).toBeNull();
  });

  it("links each draft back to its form with restore on", () => {
    expect(filterDraftHref({ kind: "new" })).toBe(
      "/my-filters/new-filter?draft=restore",
    );
    expect(filterDraftHref({ kind: "remix", filterId: 12 })).toBe(
      "/my-filters/new-filter?remixOf=12&draft=restore",
    );
    expect(filterDraftHref({ kind: "edit", filterId: 34 })).toBe(
      "/my-filters/edit/34?draft=restore",
    );
  });
});
