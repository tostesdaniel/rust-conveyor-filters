import {
  getFilterById,
  getFiltersWithItems,
  getPublicFilter,
  getPublicFilters,
  getUserFiltersByCategory,
} from "@/data/filters";
import { db } from "@/db";
import { pooledDb as txDb } from "@/db/pooled-connection";
import {
  createFilterSchema,
  updateFilterInputSchema,
  validatePublicFilterLatinChars,
} from "@/schemas/filterFormSchema";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { filterEvents, filterItems, filters } from "@/db/schema";

import {
  createTRPCRouter,
  ownsFilterProcedure,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

export const filterRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return getFiltersWithItems(ctx.userId);
  }),

  getById: ownsFilterProcedure.query(async ({ ctx }) => {
    return getFilterById(ctx.filterId, ctx.userId);
  }),

  getPublic: publicProcedure
    .input(
      z.object({
        filterId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      return getPublicFilter(input.filterId);
    }),

  getPublicList: publicProcedure
    .input(
      z.object({
        sort: z.enum(["popular", "new", "updated", "mostUsed"]),
        cursor: z
          .object({
            id: z.number(),
            popularityScore: z.number().optional(),
            createdAt: z.date().optional(),
            updatedAt: z.date().optional(),
            exportCount: z.number().optional(),
          })
          .optional(),
        pageSize: z.number().default(6),
        search: z.string().optional(),
        categories: z.array(z.string()).optional(),
        items: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input }) => {
      return getPublicFilters(input);
    }),

  getByCategory: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getUserFiltersByCategory(ctx.userId, input.categoryId);
    }),

  getPublicListInfinite: publicProcedure
    .input(
      z.object({
        sort: z.enum(["popular", "new", "updated", "mostUsed"]),
        cursor: z
          .object({
            id: z.number(),
            popularityScore: z.number().optional(),
            createdAt: z.date().optional(),
            updatedAt: z.date().optional(),
            exportCount: z.number().optional(),
          })
          .optional(),
        pageSize: z.number().default(6),
        search: z.string().optional(),
        categories: z.array(z.string()).optional(),
        items: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input }) => {
      return getPublicFilters(input);
    }),

  create: protectedProcedure
    .input(createFilterSchema)
    .mutation(async ({ ctx, input }) => {
      const parsed = createFilterSchema.safeParse(input);

      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid form data",
        });
      }

      const newFilter = parsed.data;

      // Validate Latin characters for public filters
      if (
        newFilter.isPublic &&
        !validatePublicFilterLatinChars(newFilter.name, newFilter.description)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot create public filter with non-English characters. Make it private or use English letters only.",
        });
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

        return insertedFilter;
      } catch (error) {
        console.error("Error creating filter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create filter",
        });
      }
    }),

  update: ownsFilterProcedure
    .input(updateFilterInputSchema)
    .mutation(async ({ input }) => {
      const { data, filterId, removedItems, addedItems } = input;

      // Get the current filter data first to validate Latin characters
      const currentFilter = await db.query.filters.findFirst({
        where: eq(filters.id, filterId),
      });

      if (!currentFilter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Filter not found",
        });
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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot update to public with non-English characters. Use English letters or keep filter private.",
        });
      }

      const updateData: Partial<{
        name: string;
        description: string | undefined;
        imagePath: string;
        categoryId: number | null;
        subCategoryId: number | null;
        isPublic: boolean | undefined;
        updatedAt: Date;
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
      updateData.updatedAt = new Date();

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
              updatedAt: new Date(),
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

        return { success: true };
      } catch (error) {
        console.error("Error updating filter:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update filter",
        });
      }
    }),

  delete: ownsFilterProcedure.mutation(async ({ ctx }) => {
    const filterId = ctx.filterId;
    try {
      await txDb.transaction(async (tx) => {
        const [deletedFilter] = await tx
          .delete(filters)
          .where(eq(filters.id, filterId))
          .returning();

        if (!deletedFilter) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Filter not found",
          });
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

      return { success: true };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete filter",
      });
    }
  }),

  updateOrder: protectedProcedure
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
    .mutation(async ({ ctx, input }) => {
      const { filters: filterUpdates, categoryId, subCategoryId } = input;

      try {
        await txDb.transaction(async (tx) => {
          const updatePromises = filterUpdates.map(({ filterId, order }) =>
            tx
              .update(filters)
              .set({
                order,
                updatedAt: sql`now()`,
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

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update filter order",
        });
      }
    }),

  logEvent: publicProcedure
    .input(
      z.object({
        filterId: z.number(),
        eventType: z.enum(["view", "export"]),
        success: z.boolean(),
        userId: z.string().nullable(),
        ip: z.string().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const { filterId, eventType, success, userId, ip } = input;

      await db.insert(filterEvents).values({
        filterId,
        eventType,
        userId: userId || null,
        ip: userId ? null : ip,
      });

      if (success) {
        await db
          .update(filters)
          .set({
            [eventType === "view" ? "viewCount" : "exportCount"]: sql`${
              filters[eventType === "view" ? "viewCount" : "exportCount"]
            } + 1`,
            popularityScore: sql`
            GREATEST(0, ${filters.popularityScore}) + 
            ${eventType === "view" ? 1 : 5}
          `,
          })
          .where(eq(filters.id, filterId));
      }

      return { success };
    }),
});
