import { describe, expect, it } from "vitest";

import { MAX_FILTER_ITEMS } from "@/config/constants";
import {
  createFilterSchema,
  updateFilterSchema,
} from "@/schemas/filterFormSchema";

function item(itemId: number, extra: Record<string, unknown> = {}) {
  return {
    itemId,
    name: `item-${itemId}`,
    imagePath: `items/${itemId}`,
    max: 0,
    buffer: 0,
    min: 0,
    ...extra,
  };
}

function categoryRow(categoryId: number) {
  return {
    name: `category-${categoryId}`,
    categoryId,
    max: 0,
    buffer: 0,
    min: 0,
  };
}

function validFilter(overrides: Record<string, unknown> = {}) {
  return {
    name: "My Filter",
    description: "A perfectly ordinary description",
    imagePath: "images/filter.png",
    category: { categoryId: null, subCategoryId: null },
    items: [item(1)],
    ...overrides,
  };
}

describe("createFilterSchema", () => {
  it("accepts a filter with the minimum required fields", () => {
    const result = createFilterSchema.safeParse(validFilter());
    expect(result.success).toBe(true);
  });

  it("fills in the defaults the form reads back", () => {
    const result = createFilterSchema.parse(validFilter());
    expect(result.category).toEqual({ categoryId: null, subCategoryId: null });
  });

  // Must stay undefined: updateFilter reads a present false as "make private".
  it("leaves an omitted isPublic undefined rather than defaulting it", () => {
    expect(createFilterSchema.parse(validFilter()).isPublic).toBeUndefined();
    expect(
      createFilterSchema.parse(validFilter({ isPublic: true })).isPublic,
    ).toBe(true);
  });

  it("allows an empty description but not a one-character one", () => {
    expect(
      createFilterSchema.safeParse(validFilter({ description: "" })).success,
    ).toBe(true);
    expect(
      createFilterSchema.safeParse(validFilter({ description: "x" })).success,
    ).toBe(false);
  });

  it("rejects a name shorter than two characters", () => {
    const result = createFilterSchema.safeParse(validFilter({ name: "x" }));
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Name must be at least 2 characters long",
    );
  });

  it("requires an image", () => {
    const result = createFilterSchema.safeParse(
      validFilter({ imagePath: "" }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("You must select an image");
  });

  describe("item array refinements", () => {
    it("requires at least one item", () => {
      const result = createFilterSchema.safeParse(validFilter({ items: [] }));
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((i) => i.message)).toContain(
        "You must have at least 1 item",
      );
    });

    it("caps the item count", () => {
      const items = Array.from({ length: MAX_FILTER_ITEMS + 1 }, (_, i) =>
        item(i + 1),
      );
      const result = createFilterSchema.safeParse(validFilter({ items }));
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((i) => i.message)).toContain(
        `You cannot have more than ${MAX_FILTER_ITEMS} items`,
      );
    });

    it("rejects duplicate item ids", () => {
      const result = createFilterSchema.safeParse(
        validFilter({ items: [item(1), item(1)] }),
      );
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((i) => i.message)).toContain(
        "No duplicate items allowed",
      );
    });

    it("rejects duplicate category ids", () => {
      const result = createFilterSchema.safeParse(
        validFilter({ items: [categoryRow(3), categoryRow(3)] }),
      );
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((i) => i.message)).toContain(
        "No duplicate items allowed",
      );
    });

    it("allows an item and a category that share a numeric id", () => {
      const result = createFilterSchema.safeParse(
        validFilter({ items: [item(3), categoryRow(3)] }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe("Latin-character check on public filters", () => {
    const cyrillic = "Мой фильтр";

    it("flags a non-Latin name with a custom issue on the name path", () => {
      const result = createFilterSchema.safeParse(
        validFilter({ isPublic: true, name: cyrillic }),
      );
      expect(result.success).toBe(false);
      const issue = result.error?.issues.find(
        (i) => i.path.join(".") === "name",
      );
      expect(issue?.code).toBe("custom");
      expect(issue?.message).toMatch(/English letters only/);
    });

    it("flags a non-Latin description on the description path", () => {
      const result = createFilterSchema.safeParse(
        validFilter({ isPublic: true, description: cyrillic }),
      );
      expect(result.success).toBe(false);
      const issue = result.error?.issues.find(
        (i) => i.path.join(".") === "description",
      );
      expect(issue?.code).toBe("custom");
    });

    it("reports both fields at once when both are non-Latin", () => {
      const result = createFilterSchema.safeParse(
        validFilter({ isPublic: true, name: cyrillic, description: cyrillic }),
      );
      expect(result.success).toBe(false);
      expect(result.error?.issues.map((i) => i.path.join("."))).toEqual(
        expect.arrayContaining(["name", "description"]),
      );
    });

    it("leaves private filters alone", () => {
      const result = createFilterSchema.safeParse(
        validFilter({ isPublic: false, name: cyrillic, description: cyrillic }),
      );
      expect(result.success).toBe(true);
    });
  });

  it("accepts an optional fork source id but rejects a non-positive one", () => {
    expect(
      createFilterSchema.safeParse(validFilter({ forkedFromId: 12 })).success,
    ).toBe(true);
    expect(
      createFilterSchema.safeParse(validFilter({ forkedFromId: 0 })).success,
    ).toBe(false);
  });
});

describe("updateFilterSchema", () => {
  it("accepts a single field without the rest", () => {
    const result = updateFilterSchema.safeParse({ name: "Renamed" });
    expect(result.success).toBe(true);
  });

  it("still validates the fields that are present", () => {
    const result = updateFilterSchema.safeParse({ name: "x" });
    expect(result.success).toBe(false);
  });

  it("skips the Latin-character check that create applies", () => {
    const result = updateFilterSchema.safeParse({
      name: "Мой фильтр",
      isPublic: true,
    });
    expect(result.success).toBe(true);
  });
});
