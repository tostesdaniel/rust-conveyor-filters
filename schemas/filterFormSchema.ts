import { z } from "zod";

export const createFilterSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50),
  description: z
    .string()
    .min(2, { message: "Description must be at least 2 characters long" })
    .max(256),
  authorId: z.string().optional(), // set by the server when creating a new filter
  imagePath: z.string().min(1, { message: "You must select an image" }),
  isPublic: z.boolean().default(false).optional(),
  items: z
    .array(
      z.object({
        id: z.coerce.number(),
        itemId: z.coerce.number(),
        name: z.string(),
        imagePath: z.string(),
        shortname: z.string(),
        max: z.coerce.number().min(0, "Max must be at least 0"),
        buffer: z.coerce.number().min(0, "Buffer must be at least 0"),
        min: z.coerce.number().min(0, "Min must be at least 0"),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
      }),
    )
    .refine((data) => data.length <= 30, {
      message: "You cannot have more than 30 items",
    })
    .refine((data) => data.length > 0, {
      message: "You must have at least 1 item",
    })
    .refine(
      (data) => {
        const ids = data.map((item) => item.itemId);
        return new Set(ids).size === ids.length;
      },
      {
        message: "No duplicate items allowed",
      },
    ),
});
