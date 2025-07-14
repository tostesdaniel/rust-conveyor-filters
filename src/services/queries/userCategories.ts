"use server";

import {
  getUserCategories as getUserCategoriesDb,
  getUserCategoryHierarchy as getUserCategoryHierarchyDb,
} from "@/data";

import { authenticatedProcedure } from "@/lib/safe-action";

export const getUserCategoryHierarchy = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await getUserCategoryHierarchyDb(ctx.userId);
  });

export const getUserCategories = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await getUserCategoriesDb(ctx.userId);
  });
