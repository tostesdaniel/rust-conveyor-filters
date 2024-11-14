"use server";

import { db } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
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
      ? await db.query.subCategories.findFirst({
          where: and(
            eq(subCategories.name, input.name),
            eq(subCategories.parentId, input.parentId),
            eq(subCategories.userId, ctx.userId),
          ),
        })
      : await db.query.userCategories.findFirst({
          where: and(
            eq(userCategories.name, input.name),
            eq(userCategories.userId, ctx.userId),
          ),
        });

    if (existingCategory) {
      throw "Category with this name already exists at this level";
    }

    if (input.parentId) {
      const parentCategory = await db.query.userCategories.findFirst({
        where: eq(userCategories.id, input.parentId),
      });

      if (!parentCategory) {
        throw "Parent category not found";
      }

      return await db
        .insert(subCategories)
        .values({
          name: input.name,
          parentId: input.parentId,
          userId: ctx.userId,
        })
        .returning();
    }

    return await db
      .insert(userCategories)
      .values({
        name: input.name,
        userId: ctx.userId,
      })
      .returning();
  });

export const getUserCategoryHierarchy = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await db.query.userCategories.findMany({
      where: eq(userCategories.userId, ctx.userId),
      with: {
        filters: {
          where: isNull(filters.subCategoryId),
          with: {
            filterItems: {
              with: { category: true, item: true },
            },
          },
        },
        subCategories: {
          with: {
            filters: {
              with: {
                filterItems: {
                  with: { category: true, item: true },
                },
              },
            },
          },
        },
      },
    });
  });

export const getUserCategories = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await db.query.userCategories.findMany({
      where: eq(userCategories.userId, ctx.userId),
      with: { subCategories: true },
    });
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
    const { isSubCategory } = input;
    const existingFilter = await db.query.filters.findFirst({
      where: and(
        eq(filters.id, input.filterId),
        eq(filters.authorId, ctx.userId),
      ),
    });

    if (!existingFilter) {
      throw "Filter not found";
    }

    if (isSubCategory) {
      const subCategory = await db.query.subCategories.findFirst({
        where: and(
          eq(subCategories.id, input.categoryId),
          eq(subCategories.userId, ctx.userId),
        ),
      });

      if (!subCategory) {
        throw "Subcategory not found";
      }

      await db
        .update(filters)
        .set({
          categoryId: subCategory.parentId,
          subCategoryId: input.categoryId,
        })
        .where(
          and(eq(filters.id, input.filterId), eq(filters.authorId, ctx.userId)),
        );
    } else {
      await db
        .update(filters)
        .set({ categoryId: input.categoryId, subCategoryId: null })
        .where(
          and(eq(filters.id, input.filterId), eq(filters.authorId, ctx.userId)),
        );
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
    await db
      .update(filters)
      .set(input.isSubCategory ? { subCategoryId: null } : { categoryId: null })
      .where(
        and(eq(filters.id, input.filterId), eq(filters.authorId, ctx.userId)),
      );
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
    if (input.isSubCategory) {
      await db
        .delete(subCategories)
        .where(
          and(
            eq(subCategories.id, input.categoryId),
            eq(subCategories.userId, ctx.userId),
          ),
        );
    } else {
      await db
        .delete(userCategories)
        .where(
          and(
            eq(userCategories.id, input.categoryId),
            eq(userCategories.userId, ctx.userId),
          ),
        );
    }
  });
