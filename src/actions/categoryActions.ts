"use server";

import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import * as z from "zod";

import { authenticatedProcedure } from "@/lib/safe-action";
import { filters, userCategories } from "@/db/schema";

export const createCategory = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      name: z.string().min(1).max(255),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const existingCategory = await db.query.userCategories.findFirst({
      where: and(
        eq(userCategories.name, input.name),
        eq(userCategories.userId, ctx.userId),
      ),
    });
    if (existingCategory) {
      throw new Error("Category already exists");
    }
    const newCategory = await db
      .insert(userCategories)
      .values({
        name: input.name,
        userId: ctx.userId,
      })
      .returning();
    return newCategory;
  });

export const getUserCategories = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    const categoryNames = await db.query.userCategories.findMany({
      where: eq(userCategories.userId, ctx.userId),
    });
    return categoryNames;
  });

export const getCategoriesWithOwnFilters = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    const categories = await db.query.userCategories.findMany({
      where: eq(userCategories.userId, ctx.userId),
      with: {
        filters: {
          with: {
            filterItems: {
              with: { category: true, item: true },
            },
          },
          where: eq(filters.authorId, ctx.userId),
        },
      },
    });
    return categories;
  });

export const clearFilterCategory = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      filterId: z.number(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    await db
      .update(filters)
      .set({ categoryId: null })
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
    }),
  )
  .handler(async ({ ctx, input }) => {
    await db
      .update(userCategories)
      .set({ name: input.name })
      .where(
        and(
          eq(userCategories.id, input.categoryId),
          eq(userCategories.userId, ctx.userId),
        ),
      );
  });

export const deleteCategory = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      categoryId: z.number(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    await db
      .delete(userCategories)
      .where(
        and(
          eq(userCategories.id, input.categoryId),
          eq(userCategories.userId, ctx.userId),
        ),
      );
  });
