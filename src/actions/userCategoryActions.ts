"use server";

import {
  createSubCategory,
  createUserCategory,
  deleteMainCategory,
  deleteSubCategory,
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
  getMaxOrderInUncategorized,
  moveFilterToCategory,
  moveFilterToSubCategory,
  moveFilterToUncategorized,
  renameMainCategory,
  renameSubCategory,
} from "@/data";
import { pooledDb as txDb } from "@/db/pooled-connection";
import { and, eq } from "drizzle-orm";
import * as z from "zod";

import { authenticatedProcedure } from "@/lib/safe-action";
import { filters } from "@/db/schema";

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
          await moveFilterToSubCategory(
            {
              filterId,
              targetSubCategoryId: subCategory.id,
              parentCategoryId: subCategory.parentId,
              authorId: ctx.userId,
              newOrder,
            },
            tx,
          );
        } else {
          // Main category
          const maxOrder = await getMaxOrderInCategory(categoryId, ctx.userId);

          const newOrder = maxOrder ? maxOrder.order + 1 : 0;

          await moveFilterToCategory(
            {
              filterId,
              targetCategoryId: categoryId,
              authorId: ctx.userId,
              newOrder,
            },
            tx,
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
        const currentFilter = await findExistingFilter(
          input.filterId,
          ctx.userId,
          tx,
        );

        if (!currentFilter) {
          throw "Filter not found";
        }

        const sourceFilters = currentFilter.subCategoryId
          ? await findFiltersInSubCategory(
              currentFilter.subCategoryId,
              ctx.userId,
            )
          : currentFilter.categoryId
            ? await findFiltersInMainCategory(
                currentFilter.categoryId,
                ctx.userId,
              )
            : [];

        const sourceUpdatePromises = sourceFilters
          .filter((f) => f.id !== input.filterId)
          .map((filter, index) =>
            tx
              .update(filters)
              .set({ order: index })
              .where(eq(filters.id, filter.id)),
          );

        const isClearingFromSubCategory = !!currentFilter.subCategoryId;
        const hasParentCategory = currentFilter.categoryId;

        if (isClearingFromSubCategory && hasParentCategory) {
          const parentFilters = await findFiltersInMainCategory(
            currentFilter.categoryId!, // Asserted by hasParentCategory
            ctx.userId,
          );

          // Always set order to next available in parent category
          const newOrder = parentFilters.length;

          await moveFilterToCategory(
            {
              filterId: input.filterId,
              targetCategoryId: currentFilter.categoryId!,
              newOrder,
              authorId: ctx.userId,
            },
            tx,
          );

          await tx
            .update(filters)
            .set({
              subCategoryId: null,
              order: newOrder,
            })
            .where(
              and(
                eq(filters.id, input.filterId),
                eq(filters.authorId, ctx.userId),
              ),
            );
        } else {
          // For main category clearing
          const uncategorizedFilters = await findUncategorizedFilters(
            ctx.userId,
          );

          const newOrder = uncategorizedFilters.length;

          await moveFilterToUncategorized(
            {
              filterId: input.filterId,
              authorId: ctx.userId,
              newOrder,
            },
            tx,
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
    const { categoryId, name, isSubCategory } = input;
    const { userId } = ctx;
    if (isSubCategory) {
      await renameSubCategory({
        subCategoryId: categoryId,
        name,
        userId,
      });
    } else {
      await renameMainCategory({
        categoryId,
        name,
        userId,
      });
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
    const { isSubCategory, categoryId } = input;
    const { userId } = ctx;

    try {
      await txDb.transaction(async (tx) => {
        const sourceCategoryFilters = isSubCategory
          ? await findFiltersInSubCategory(categoryId, ctx.userId)
          : await findFiltersInMainCategory(categoryId, ctx.userId);

        // Relocate filters if any exist
        if (sourceCategoryFilters.length > 0) {
          if (isSubCategory) {
            // Move filters from subcategory to parent category
            const parentCategoryId = sourceCategoryFilters[0].categoryId;
            if (!parentCategoryId) {
              throw new Error(
                "Invalid subcategory: missing parent category. Request support in Discord.",
              );
            }
            const maxOrderInParent = await getMaxOrderInCategory(
              parentCategoryId,
              userId,
            );
            const startingOrder = maxOrderInParent
              ? maxOrderInParent.order + 1
              : 0;

            const movePromises = sourceCategoryFilters.map((filter, index) =>
              moveFilterToCategory(
                {
                  filterId: filter.id,
                  targetCategoryId: parentCategoryId,
                  authorId: userId,
                  newOrder: startingOrder + index,
                },
                tx,
              ),
            );

            await Promise.all(movePromises);
          } else {
            // Move filters from main category to uncategorized
            const maxOrderInUncategorized =
              await getMaxOrderInUncategorized(userId);
            const startingOrder = maxOrderInUncategorized
              ? maxOrderInUncategorized.order + 1
              : 0;

            const movePromises = sourceCategoryFilters.map((filter, index) =>
              moveFilterToUncategorized(
                {
                  filterId: filter.id,
                  authorId: userId,
                  newOrder: startingOrder + index,
                },
                tx,
              ),
            );

            await Promise.all(movePromises);
          }
        }

        if (isSubCategory) {
          await deleteSubCategory(categoryId, ctx.userId, tx);
        } else {
          await deleteMainCategory(categoryId, ctx.userId, tx);
        }
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      throw new Error("Failed to delete category");
    }
  });
