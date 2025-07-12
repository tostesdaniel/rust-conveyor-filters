"use server";

import {
  createSubCategory,
  createUserCategory,
  findExistingFilter,
  findExistingSubCategory,
  findExistingUserCategory,
  findFiltersInMainCategory,
  findFiltersInSubCategory,
  findParentCategoryById,
  findSubCategoryById,
  findUncategorizedFilters,
  getMaxOrderInCategory,
  getMaxOrderInSubCategory,
} from "@/data";
import { db } from "@/db";
import { pooledDb as txDb } from "@/db/pooled-connection";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import * as z from "zod";

import { authenticatedProcedure } from "@/lib/safe-action";
import { filters, subCategories, userCategories } from "@/db/schema";

export const createCategory = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      name: z.string().min(1).max(255),
      parentId: z.number().nullable(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const existingCategory = input.parentId
      ? await findExistingSubCategory(input.name, ctx.userId, input.parentId)
      : await findExistingUserCategory(input.name, ctx.userId);

    if (existingCategory) {
      throw "Category with this name already exists at this level";
    }

    if (input.parentId) {
      const parentCategory = await findParentCategoryById(input.parentId);

      if (!parentCategory) {
        throw "Parent category not found";
      }

      return await createSubCategory(input.name, ctx.userId, input.parentId);
    }

    return await createUserCategory(input.name, ctx.userId);
  });

export const manageFilterCategory = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      categoryId: z.number(),
      filterId: z.number(),
      isSubCategory: z.boolean(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const { isSubCategory, filterId, categoryId } = input;

    try {
      await txDb.transaction(async (tx) => {
        const existingFilter = await findExistingFilter(
          filterId,
          ctx.userId,
          tx,
        );

        if (!existingFilter) {
          throw new Error("Filter not found");
        }

        // Get current category filters for reordering
        const sourceCategoryFilters = existingFilter.subCategoryId
          ? await findFiltersInSubCategory(
              existingFilter.subCategoryId,
              ctx.userId,
            )
          : existingFilter.categoryId
            ? await findFiltersInMainCategory(
                existingFilter.categoryId,
                ctx.userId,
              )
            : await findUncategorizedFilters(ctx.userId);

        // Exclude the filter being moved from the source category
        const sourceUpdatePromises = sourceCategoryFilters
          .filter((f) => f.id !== filterId)
          .map((filter, index) =>
            tx
              .update(filters)
              .set({ order: index })
              .where(eq(filters.id, filter.id)),
          );

        if (isSubCategory) {
          const subCategory = await findSubCategoryById(categoryId, ctx.userId);

          if (!subCategory) {
            throw new Error("Subcategory not found");
          }

          // Get max order in destination category
          const maxOrder = await getMaxOrderInSubCategory(
            subCategory.id,
            ctx.userId,
          );
          const newOrder = maxOrder ? maxOrder.order + 1 : 0;

          // Update the filter's category and order
          await tx
            .update(filters)
            .set({
              categoryId: subCategory.parentId,
              subCategoryId: categoryId,
              order: newOrder,
              updatedAt: new Date(),
            })
            .where(
              and(eq(filters.id, filterId), eq(filters.authorId, ctx.userId)),
            );
        } else {
          // Main category
          const maxOrder = await getMaxOrderInCategory(categoryId, ctx.userId);

          const newOrder = maxOrder ? maxOrder.order + 1 : 0;

          await tx
            .update(filters)
            .set({
              categoryId,
              subCategoryId: null,
              order: newOrder,
              updatedAt: new Date(),
            })
            .where(
              and(eq(filters.id, filterId), eq(filters.authorId, ctx.userId)),
            );
        }
        await Promise.all(sourceUpdatePromises);
      });
    } catch (error) {
      console.error(error);
      throw "Failed to update filter category";
    }
  });

export const clearFilterCategory = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      filterId: z.number(),
      isSubCategory: z.boolean(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    try {
      await txDb.transaction(async (tx) => {
        const currentFilter = await tx.query.filters.findFirst({
          where: and(
            eq(filters.id, input.filterId),
            eq(filters.authorId, ctx.userId),
          ),
        });

        if (!currentFilter) {
          throw "Filter not found";
        }

        const sourceFilters = await tx.query.filters.findMany({
          where: and(
            eq(filters.authorId, ctx.userId),
            currentFilter.categoryId
              ? eq(filters.categoryId, currentFilter.categoryId)
              : isNull(filters.categoryId),
            currentFilter.subCategoryId
              ? eq(filters.subCategoryId, currentFilter.subCategoryId)
              : isNull(filters.subCategoryId),
          ),
          orderBy: filters.order,
        });

        const sourceUpdatePromises = sourceFilters
          .filter((f) => f.id !== input.filterId)
          .map((filter, index) =>
            tx
              .update(filters)
              .set({ order: index })
              .where(eq(filters.id, filter.id)),
          );

        //   const maxOrderAtDestination = await tx.query.filters.findFirst({
        //     where: and(
        //       eq(filters.authorId, ctx.userId),
        //       input.isSubCategory
        //         ? eq(filters.categoryId, currentFilter.categoryId!)
        //         : isNull(filters.subCategoryId),
        //     ),
        //     orderBy: desc(filters.order),
        //   });

        //   const newOrder = maxOrderAtDestination
        //     ? maxOrderAtDestination.order + 1
        //     : 0;

        //   await tx
        //     .update(filters)
        //     .set({
        //       ...(input.isSubCategory
        //         ? { subCategoryId: null }
        //         : { categoryId: null }),
        //       order: newOrder,
        //       updatedAt: sql`now()`,
        //     })
        //     .where(
        //       and(
        //         eq(filters.id, input.filterId),
        //         eq(filters.authorId, ctx.userId),
        //       ),
        //     );

        //   await Promise.all(sourceUpdatePromises);
        // });
        if (input.isSubCategory && currentFilter.categoryId) {
          const parentFilters = await tx.query.filters.findMany({
            where: and(
              eq(filters.authorId, ctx.userId),
              eq(filters.categoryId, currentFilter.categoryId),
              isNull(filters.subCategoryId),
            ),
            orderBy: filters.order,
          });

          // Always set order to next available in parent category
          const newOrder = parentFilters.length;

          await tx
            .update(filters)
            .set({
              subCategoryId: null,
              order: newOrder,
              updatedAt: sql`now()`,
            })
            .where(
              and(
                eq(filters.id, input.filterId),
                eq(filters.authorId, ctx.userId),
              ),
            );
        } else {
          // For root category clearing
          const uncategorizedFilters = await tx.query.filters.findMany({
            where: and(
              eq(filters.authorId, ctx.userId),
              isNull(filters.categoryId),
              isNull(filters.subCategoryId),
            ),
            orderBy: filters.order,
          });

          const newOrder = uncategorizedFilters.length;

          await tx
            .update(filters)
            .set({
              categoryId: null,
              subCategoryId: null,
              order: newOrder,
              updatedAt: sql`now()`,
            })
            .where(
              and(
                eq(filters.id, input.filterId),
                eq(filters.authorId, ctx.userId),
              ),
            );
        }

        await Promise.all(sourceUpdatePromises);
      });
    } catch (error) {
      console.error("Error clearing filter category:", error);
      throw "Failed to clear filter category";
    }
  });

export const renameCategory = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      categoryId: z.number(),
      name: z.string().min(1).max(255),
      isSubCategory: z.boolean(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    if (input.isSubCategory) {
      await db
        .update(subCategories)
        .set({ name: input.name })
        .where(
          and(
            eq(subCategories.id, input.categoryId),
            eq(subCategories.userId, ctx.userId),
          ),
        );
    } else {
      await db
        .update(userCategories)
        .set({ name: input.name })
        .where(
          and(
            eq(userCategories.id, input.categoryId),
            eq(userCategories.userId, ctx.userId),
          ),
        );
    }
  });

export const deleteCategory = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      categoryId: z.number(),
      isSubCategory: z.boolean(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    try {
      await txDb.transaction(async (tx) => {
        const filtersInCategory = await tx.query.filters.findMany({
          where: and(
            eq(filters.authorId, ctx.userId),
            input.isSubCategory
              ? eq(filters.subCategoryId, input.categoryId)
              : eq(filters.categoryId, input.categoryId),
          ),
        });

        if (filtersInCategory.length > 0) {
          const maxOrderAtDestination = await tx.query.filters.findFirst({
            where: and(
              eq(filters.authorId, ctx.userId),
              input.isSubCategory
                ? eq(filters.categoryId, filtersInCategory[0].categoryId!)
                : isNull(filters.categoryId),
            ),
            orderBy: desc(filters.order),
          });

          let nextOrder = maxOrderAtDestination
            ? maxOrderAtDestination.order + 1
            : 0;

          const filterUpdatePromises = filtersInCategory.map((filter) =>
            tx
              .update(filters)
              .set({
                ...(input.isSubCategory
                  ? { subCategoryId: null }
                  : { categoryId: null, subCategoryId: null }),
                order: nextOrder++,
                updatedAt: sql`now()`,
              })
              .where(eq(filters.id, filter.id)),
          );

          await Promise.all(filterUpdatePromises);
        }

        if (input.isSubCategory) {
          await tx
            .delete(subCategories)
            .where(
              and(
                eq(subCategories.id, input.categoryId),
                eq(subCategories.userId, ctx.userId),
              ),
            );
        } else {
          await tx
            .delete(userCategories)
            .where(
              and(
                eq(userCategories.id, input.categoryId),
                eq(userCategories.userId, ctx.userId),
              ),
            );
        }
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      throw new Error("Failed to delete category");
    }
  });
