import { z } from "zod";

// Base schema without superRefine - used for partial updates
const baseFilterSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50),
  description: z
    .string()
    .min(2, { message: "Description must be at least 2 characters long" })
    .max(255)
    .or(z.literal("")),
  authorId: z.string().optional(), // set by the server when creating a new filter
  imagePath: z.string().min(1, { message: "You must select an image" }),
  category: z.object({
    categoryId: z.number().nullable().default(null),
    subCategoryId: z.number().nullable().default(null),
  }),
  isPublic: z.boolean().default(false).optional(),
  items: z
    .array(
      z.union([
        z.object({
          itemId: z.number(),
          name: z.string(),
          imagePath: z.string(),
          max: z.number().min(0),
          buffer: z.number().min(0),
          min: z.number().min(0),
        }),
        z.object({
          name: z.string(),
          categoryId: z.number(),
          max: z.number().min(0),
          buffer: z.number().min(0),
          min: z.number().min(0),
        }),
      ]),
    )
    .refine((data) => data.length <= 30, {
      message: "You cannot have more than 30 items",
    })
    .refine((data) => data.length > 0, {
      message: "You must have at least 1 item",
    })
    .refine(
      (data) => {
        type ItemEntry = {
          itemId: number;
          name: string;
          imagePath: string;
          max: number;
          buffer: number;
          min: number;
        };

        type CategoryEntry = {
          name: string;
          categoryId: number;
          max: number;
          buffer: number;
          min: number;
        };

        const itemIds = data
          .filter((item): item is ItemEntry => "itemId" in item)
          .map((item) => item.itemId);

        const categoryIds = data
          .filter((item): item is CategoryEntry => "categoryId" in item)
          .map((item) => item.categoryId);

        const hasUniqueItemIds = new Set(itemIds).size === itemIds.length;
        const hasUniqueCategoryIds =
          new Set(categoryIds).size === categoryIds.length;

        return hasUniqueItemIds && hasUniqueCategoryIds;
      },
      {
        message: "No duplicate items allowed",
      },
    ),
});

export const createFilterSchema = baseFilterSchema.superRefine((data, ctx) => {
  // Only validate Latin characters if filter is public
  if (!data.isPublic) return;

  if (!validateNameLatinChars(data.name)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Public filters: English letters only. For non-English characters, make filter private.",
      path: ["name"],
    });
  }

  if (!validateDescriptionLatinChars(data.description)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Public filters: English letters only. For non-English characters, make filter private.",
      path: ["description"],
    });
  }
});

/**
 * Zod schema for updating existing filters with partial validation.
 *
 * All fields are optional since this is used for partial updates.
 * Does not include superRefine validation to avoid conflicts with partial data.
 * Server-side validation should be used for Latin character checking on updates.
 *
 * @example
 * ```typescript
 * const result = updateFilterSchema.safeParse({
 *   name: "Updated Name", // Only updating name
 *   isPublic: true
 * });
 * ```
 */
export const updateFilterSchema = baseFilterSchema.partial();

/**
 * Complete input schema for the updateFilter server action.
 *
 * Includes the partial filter data plus metadata fields for the update operation.
 * Used in server actions to handle filter updates with proper validation.
 *
 * @example
 * ```typescript
 * const result = updateFilterInputSchema.safeParse({
 *   data: { name: "Updated Name", isPublic: true },
 *   filterId: 123,
 *   removedItems: [...],
 *   addedItems: [...]
 * });
 * ```
 */
export const updateFilterInputSchema = z.object({
  data: updateFilterSchema,
  filterId: z.number(),
  removedItems: z
    .array(
      z.union([
        z.object({
          itemId: z.number(),
          name: z.string(),
          imagePath: z.string(),
          max: z.number(),
          buffer: z.number(),
          min: z.number(),
        }),
        z.object({
          categoryId: z.number(),
          name: z.string(),
          max: z.number(),
          buffer: z.number(),
          min: z.number(),
        }),
      ]),
    )
    .optional(),
  addedItems: z
    .array(
      z.union([
        z.object({
          itemId: z.number(),
          name: z.string(),
          imagePath: z.string(),
          max: z.number(),
          buffer: z.number(),
          min: z.number(),
        }),
        z.object({
          categoryId: z.number(),
          name: z.string(),
          max: z.number(),
          buffer: z.number(),
          min: z.number(),
        }),
      ]),
    )
    .optional(),
});

export function isLatinCharsOnly(text: string): boolean {
  const latinOnlyRegex = /^[a-zA-Z0-9\s\.,!?;:\-'"()&@#$%^*+={}[\]|\\<>/]*$/;
  return latinOnlyRegex.test(text);
}

export function validateNameLatinChars(name: string): boolean {
  return isLatinCharsOnly(name);
}

export function validateDescriptionLatinChars(description: string): boolean {
  return description === "" || isLatinCharsOnly(description);
}

/**
 * Validates if both name and description contain only Latin characters for public filters.
 *
 * Used in server actions to validate the complete filter data.
 * Handles null descriptions gracefully (treats as valid).
 *
 * @param name - The filter name to validate
 * @param description - The filter description to validate (can be null)
 * @returns True if both name and description contain only Latin characters
 *
 * @example
 * ```typescript
 * validatePublicFilterLatinChars("My Filter", "Great filter"); // true
 * validatePublicFilterLatinChars("My Filter", null);           // true
 * validatePublicFilterLatinChars("Мой фильтр", "Description"); // false
 * ```
 */
export function validatePublicFilterLatinChars(
  name: string,
  description: string | null,
): boolean {
  const nameIsValid = validateNameLatinChars(name);
  const descriptionIsValid =
    !description || validateDescriptionLatinChars(description);
  return nameIsValid && descriptionIsValid;
}
