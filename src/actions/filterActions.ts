"use server";

import { createFilterSchema } from "@/schemas/filterFormSchema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { ownsFilterProcedure } from "@/lib/safe-action";
import { filterItems, filters } from "@/db/schema";

import { db } from "../db";

export async function createFilter(formData: FormData) {
  const { userId } = auth();

  if (!userId) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const parsed = createFilterSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    imagePath: formData.get("imagePath"),
    items: JSON.parse(formData.get("items") as string),
    isPublic: formData.get("isPublic") === "true" ? true : false,
    authorId: userId,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data",
    };
  }

  const newFilter = parsed.data;

  try {
    const [insertedFilter] = await db
      .insert(filters)
      .values({
        name: newFilter.name,
        description: newFilter.description,
        authorId: newFilter.authorId as string,
        imagePath: newFilter.imagePath,
        isPublic: newFilter.isPublic,
      })
      .returning();

    const filterItemsData = newFilter.items.map(
      (item: (typeof newFilter.items)[0]) => {
        if ("itemId" in item) {
          return {
            filterId: insertedFilter.id,
            itemId: item.itemId,
            categoryId: null,
            max: item.max,
            buffer: item.buffer,
            min: item.min,
          };
        } else {
          return {
            filterId: insertedFilter.id,
            itemId: null,
            categoryId: item.categoryId,
            max: item.max,
            buffer: item.buffer,
            min: item.min,
          };
        }
      },
    );

    await db.insert(filterItems).values(filterItemsData);

    return {
      success: true,
      message: "Filter created successfully",
    };
  } catch (error) {
    console.error("Error creating filter:", error);
    return {
      success: false,
      message: "Failed to create filter",
    };
  }
}

export const updateFilter = ownsFilterProcedure
  .createServerAction()
  .input(
    z.object({
      data: createFilterSchema.partial(),
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
    }),
  )
  .handler(async ({ input }) => {
    const { data, filterId, removedItems, addedItems } = input;
    const updateData: Partial<typeof data> = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.imagePath) updateData.imagePath = data.imagePath;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    try {
      if (Object.keys(updateData).length > 0) {
        await db
          .update(filters)
          .set(updateData)
          .where(eq(filters.id, filterId));
      }

      if (data.items) {
        const filterItemsData = data.items.map(
          (item: (typeof data.items)[0]) => {
            return {
              filterId: filterId,
              itemId: "itemId" in item ? item.itemId : null,
              categoryId: "categoryId" in item ? item.categoryId : null,
              max: item.max,
              buffer: item.buffer,
              min: item.min,
            };
          },
        );

        for (const item of filterItemsData) {
          const isCategory = item.categoryId !== null;
          await db
            .update(filterItems)
            .set(item)
            .where(
              and(
                eq(filterItems.filterId, item.filterId),
                isCategory
                  ? eq(filterItems.categoryId, item.categoryId!)
                  : eq(filterItems.itemId, item.itemId!),
              ),
            );
        }
      }

      if (removedItems && removedItems.length > 0) {
        for (const item of removedItems) {
          if ("itemId" in item) {
            await db
              .delete(filterItems)
              .where(
                and(
                  eq(filterItems.filterId, filterId),
                  eq(filterItems.itemId, item.itemId),
                ),
              );
          } else {
            await db
              .delete(filterItems)
              .where(
                and(
                  eq(filterItems.filterId, filterId),
                  eq(filterItems.categoryId, item.categoryId),
                ),
              );
          }
        }
      }

      if (addedItems && addedItems.length > 0) {
        const addedItemsData = addedItems.map(
          (item: (typeof addedItems)[0]) => ({
            filterId: filterId,
            itemId: "itemId" in item ? item.itemId : null,
            categoryId: "categoryId" in item ? item.categoryId : null,
            max: item.max,
            buffer: item.buffer,
            min: item.min,
          }),
        );

        await db.insert(filterItems).values(addedItemsData);
      }
    } catch (error) {
      console.error("Error updating filter:", error);
      throw new Error("Failed to update filter");
    }
  });

export const deleteFilter = ownsFilterProcedure
  .createServerAction()
  .input(
    z.object({
      filterId: z.number(),
    }),
  )
  .handler(async ({ input }) => {
    const { filterId } = input;
    try {
      await db.delete(filters).where(eq(filters.id, filterId));
    } catch (error) {
      throw new Error("Failed to delete filter");
    }
  });
