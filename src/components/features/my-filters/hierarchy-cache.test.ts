import { describe, expect, it } from "vitest";

import {
  deleteCategory,
  moveFilter,
  removeFilter,
  renameCategory,
  subCategoryLocation,
  UNCATEGORIZED,
  withoutCategory,
  type HierarchyData,
} from "@/components/features/my-filters/hierarchy-cache";

type Categories = NonNullable<HierarchyData["categories"]>;
type FilterNode = Categories[number]["filters"][number];

function filter(
  id: number,
  categoryId: number | null,
  subCategoryId: number | null,
  order: number,
) {
  return { id, categoryId, subCategoryId, order } as FilterNode;
}

function fixture(): HierarchyData {
  return {
    uncategorized: [filter(1, null, null, 0)],
    categories: [
      {
        id: 10,
        name: "Weapons",
        filters: [filter(2, 10, null, 0), filter(3, 10, null, 1)],
        subCategories: [
          {
            id: 100,
            name: "Rifles",
            parentId: 10,
            filters: [filter(4, 10, 100, 0)],
          },
        ],
      },
      { id: 20, name: "Tools", filters: [], subCategories: [] },
    ] as unknown as Categories,
  };
}

const ids = (filters: FilterNode[] | undefined) => filters?.map((f) => f.id);

describe("moveFilter", () => {
  it("moves a filter to the end of a category and updates its location", () => {
    const result = moveFilter(fixture(), 1, {
      categoryId: 10,
      subCategoryId: null,
    });

    expect(ids(result.uncategorized)).toEqual([]);
    expect(ids(result.categories?.[0].filters)).toEqual([2, 3, 1]);
    expect(result.categories?.[0].filters[2]).toMatchObject({
      categoryId: 10,
      subCategoryId: null,
      order: 2,
    });
  });

  it("moves a filter into a subcategory under its parent", () => {
    const data = fixture();
    const location = subCategoryLocation(data, 100);
    expect(location).toEqual({ categoryId: 10, subCategoryId: 100 });

    const result = moveFilter(data, 2, location!);

    expect(ids(result.categories?.[0].filters)).toEqual([3]);
    expect(ids(result.categories?.[0].subCategories[0].filters)).toEqual([
      4, 2,
    ]);
  });

  it("moves a filter to uncategorized", () => {
    const result = moveFilter(fixture(), 4, UNCATEGORIZED);

    expect(ids(result.uncategorized)).toEqual([1, 4]);
    expect(result.uncategorized?.[1]).toMatchObject({
      categoryId: null,
      subCategoryId: null,
    });
    expect(result.categories?.[0].subCategories[0].filters).toEqual([]);
  });

  it("returns the data unchanged for an unknown filter", () => {
    const data = fixture();
    expect(moveFilter(data, 999, UNCATEGORIZED)).toBe(data);
  });
});

describe("removeFilter", () => {
  it("removes a filter from wherever it is", () => {
    const result = removeFilter(fixture(), 4);
    expect(result.categories?.[0].subCategories[0].filters).toEqual([]);
    expect(ids(result.uncategorized)).toEqual([1]);
  });
});

describe("deleteCategory", () => {
  it("moves a deleted subcategory's filters into the parent category", () => {
    const result = deleteCategory(fixture(), 100, true);

    expect(result.categories?.[0].subCategories).toEqual([]);
    expect(ids(result.categories?.[0].filters)).toEqual([2, 3, 4]);
    expect(result.categories?.[0].filters[2]).toMatchObject({
      categoryId: 10,
      subCategoryId: null,
    });
  });

  it("moves a deleted category's filters, subcategories included, to uncategorized", () => {
    const result = deleteCategory(fixture(), 10, false);

    expect(result.categories?.map((c) => c.id)).toEqual([20]);
    expect(ids(result.uncategorized)).toEqual([1, 2, 3, 4]);
    expect(
      result.uncategorized?.every(
        (f) => f.categoryId === null && f.subCategoryId === null,
      ),
    ).toBe(true);
  });
});

describe("withoutCategory and renameCategory", () => {
  it("removes a category or subcategory", () => {
    const categories = fixture().categories!;
    expect(withoutCategory(categories, 20, false).map((c) => c.id)).toEqual([
      10,
    ]);
    expect(withoutCategory(categories, 100, true)[0].subCategories).toEqual([]);
  });

  it("renames a category or subcategory", () => {
    const categories = fixture().categories!;
    expect(renameCategory(categories, 20, false, "Gear")[1].name).toBe("Gear");
    expect(
      renameCategory(categories, 100, true, "Pistols")[0].subCategories[0].name,
    ).toBe("Pistols");
  });
});
