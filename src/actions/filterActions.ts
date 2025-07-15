"use server";

import { pooledDb as txDb } from "@/db/pooled-connection";
import {
  createFilterSchema,
  updateFilterInputSchema,
  validatePublicFilterLatinChars,
} from "@/schemas/filterFormSchema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { authenticatedProcedure, ownsFilterProcedure } from "@/lib/safe-action";
import { filterItems, filters } from "@/db/schema";

import { db } from "../db";

export const createFilter = authenticatedProcedure
  .createServerAction()
  .input(createFilterSchema)
  .handler(async ({ ctx, input }) => {
    const parsed = createFilterSchema.safeParse(input);

    if (!parsed.success) {
      throw "Invalid form data";
    }

    const newFilter = parsed.data;

    // Validate Latin characters for public filters
    if (
      newFilter.isPublic &&
      !validatePublicFilterLatinChars(newFilter.name, newFilter.description)
    ) {
      throw "Cannot create public filter with non-English characters. Make it private or use English letters only.";
    }

    const { category } = parsed.data;
    const maxOrder = await db.query.filters.findFirst({
      where: and(
        eq(filters.authorId, ctx.userId),
        category.categoryId
          ? eq(filters.categoryId, category.categoryId)
          : isNull(filters.categoryId),
        category.subCategoryId
          ? eq(filters.subCategoryId, category.subCategoryId)
          : isNull(filters.subCategoryId),
      ),
      columns: { order: true },
      orderBy: desc(filters.order),
    });

    try {
      const [insertedFilter] = await db
        .insert(filters)
        .values({
          name: newFilter.name,
          description: newFilter.description,
          authorId: ctx.userId,
          imagePath: newFilter.imagePath,
          categoryId: newFilter.category.categoryId,
          subCategoryId: newFilter.category.subCategoryId,
          isPublic: newFilter.isPublic,
          order: maxOrder ? maxOrder.order + 1 : 0,
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
    } catch (error) {
      console.error("Error creating filter:", error);
      throw "Failed to create filter";
    }
  });

export const updateFilter = ownsFilterProcedure
  .createServerAction()
  .input(updateFilterInputSchema)
  .handler(async ({ input }) => {
    const { data, filterId, removedItems, addedItems } = input;

    // Get the current filter data first to validate Latin characters
    const currentFilter = await db.query.filters.findFirst({
      where: eq(filters.id, filterId),
    });

    if (!currentFilter) {
      throw new Error("Filter not found");
    }

    // Determine final values after update
    const finalName = data.name ?? currentFilter.name;
    const finalDescription = data.description ?? currentFilter.description;
    const finalIsPublic = data.isPublic ?? currentFilter.isPublic;

    // Validate Latin characters for public filters BEFORE making any database changes
    if (
      finalIsPublic &&
      !validatePublicFilterLatinChars(finalName, finalDescription)
    ) {
      throw "Cannot update to public with non-English characters. Use English letters or keep filter private.";
    }

    const updateData: Partial<{
      name: string;
      description: string | undefined;
      imagePath: string;
      categoryId: number | null;
      subCategoryId: number | null;
      isPublic: boolean | undefined;
    }> = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.imagePath) updateData.imagePath = data.imagePath;
    if (data.category) {
      updateData.categoryId = data.category.categoryId;
      updateData.subCategoryId = data.category.subCategoryId;
    }
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

    try {
      if (Object.keys(updateData).length > 0) {
        await db
          .update(filters)
          .set(updateData)
          .where(eq(filters.id, filterId));
      }

      if (data.items) {
        const filterItemsData = data.items.map((item) => {
          return {
            filterId: filterId,
            itemId: "itemId" in item ? item.itemId : null,
            categoryId: "categoryId" in item ? item.categoryId : null,
            max: item.max,
            buffer: item.buffer,
            min: item.min,
          };
        });

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
        const addedItemsData = addedItems.map((item) => ({
          filterId: filterId,
          itemId: "itemId" in item ? item.itemId : null,
          categoryId: "categoryId" in item ? item.categoryId : null,
          max: item.max,
          buffer: item.buffer,
          min: item.min,
        }));

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
      await txDb.transaction(async (tx) => {
        const [deletedFilter] = await tx
          .delete(filters)
          .where(eq(filters.id, filterId))
          .returning();

        if (!deletedFilter) {
          throw new Error("Filter not found");
        }

        const remainingFilters = await tx.query.filters.findMany({
          where: and(
            eq(filters.authorId, deletedFilter.authorId),
            deletedFilter.categoryId
              ? eq(filters.categoryId, deletedFilter.categoryId)
              : isNull(filters.categoryId),
            deletedFilter.subCategoryId
              ? eq(filters.subCategoryId, deletedFilter.subCategoryId)
              : isNull(filters.subCategoryId),
          ),
          columns: {
            id: true,
          },
          orderBy: filters.order,
        });

        const updatePromises = remainingFilters.map(({ id }, index) =>
          tx.update(filters).set({ order: index }).where(eq(filters.id, id)),
        );

        await Promise.all(updatePromises);
      });
    } catch (error) {
      throw new Error("Failed to delete filter");
    }
  });

export const updateFilterOrder = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      filters: z.array(
        z.object({
          filterId: z.number(),
          order: z.number(),
        }),
      ),
      categoryId: z.number().nullable(),
      subCategoryId: z.number().nullable(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const { filters: filterUpdates, categoryId, subCategoryId } = input;

    try {
      await txDb.transaction(async (tx) => {
        const updatePromises = filterUpdates.map(({ filterId, order }) =>
          tx
            .update(filters)
            .set({
              order,
            })
            .where(
              and(
                eq(filters.id, filterId),
                eq(filters.authorId, ctx.userId),
                categoryId
                  ? eq(filters.categoryId, categoryId)
                  : isNull(filters.categoryId),
                subCategoryId
                  ? eq(filters.subCategoryId, subCategoryId)
                  : isNull(filters.subCategoryId),
              ),
            ),
        );

        await Promise.all(updatePromises);
      });
    } catch (error) {
      throw new Error("Failed to update filter order");
    }
  });
