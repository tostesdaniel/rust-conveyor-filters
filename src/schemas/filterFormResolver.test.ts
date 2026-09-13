import { zodResolver } from "@hookform/resolvers/zod";
import { describe, expect, it } from "vitest";

import {
  type CreateFilterInput,
  createFilterSchema,
} from "@/schemas/filterFormSchema";

// A wrong path renders the message under no input at all, which is mostly what
// these guard.

const resolver = zodResolver(createFilterSchema);

function valid(overrides: Partial<CreateFilterInput> = {}) {
  return {
    name: "My Filter",
    description: "A perfectly ordinary description",
    imagePath: "images/filter.png",
    category: { categoryId: null, subCategoryId: null },
    items: [
      { itemId: 1, name: "item-1", imagePath: "p", max: 0, buffer: 0, min: 0 },
    ],
    ...overrides,
  } as CreateFilterInput;
}

async function resolve(values: CreateFilterInput) {
  return resolver(values, undefined, {
    fields: {},
    shouldUseNativeValidation: false,
  });
}

describe("createFilterSchema through zodResolver", () => {
  it("passes a valid filter through with the parsed values", async () => {
    const result = await resolve(valid());
    expect(result.errors).toEqual({});
    expect(result.values).toMatchObject({ name: "My Filter" });
  });

  it("reports a short name under the name field", async () => {
    const result = await resolve(valid({ name: "x" }));
    expect(result.errors.name?.message).toBe(
      "Name must be at least 2 characters long",
    );
  });

  it("reports a missing image under imagePath", async () => {
    const result = await resolve(valid({ imagePath: "" }));
    expect(result.errors.imagePath?.message).toBe("You must select an image");
  });

  it("reports item refinements under the items field", async () => {
    const result = await resolve(valid({ items: [] }));
    expect(result.errors.items?.message).toBe("You must have at least 1 item");
  });

  it("lands the public-filter name check on the name field", async () => {
    const result = await resolve(
      valid({ isPublic: true, name: "Мой фильтр" }),
    );
    expect(result.errors.name?.message).toMatch(/English letters only/);
  });

  it("lands the public-filter description check on the description field", async () => {
    const result = await resolve(
      valid({ isPublic: true, description: "Мой фильтр" }),
    );
    expect(result.errors.description?.message).toMatch(/English letters only/);
  });
});
