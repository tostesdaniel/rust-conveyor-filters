"use server";

import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import * as z from "zod";

import { authenticatedProcedure } from "@/lib/safe-action";
import { userCategories } from "@/db/schema";

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

