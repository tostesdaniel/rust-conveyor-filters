import { z } from "zod";

export const createFilterSchema = z.object({
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
        const ids = data.map((item) =>
          "itemId" in item ? item.itemId : item.categoryId,
        );
        return new Set(ids).size === ids.length;
      },
      {
        message: "No duplicate items allowed",
      },
    ),
});
