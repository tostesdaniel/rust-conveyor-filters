import { db } from "@/db";
import { and, eq, isNull } from "drizzle-orm";

import type { DbTransaction } from "@/types/db-transaction";
import { filters } from "@/db/schema";

export async function findExistingFilter(
  filterId: number,
  authorId: string,
  tx?: DbTransaction,
) {
  const dbInstance = tx || db;
  return await dbInstance.query.filters.findFirst({
    where: and(eq(filters.id, filterId), eq(filters.authorId, authorId)),
  });
}

export async function findFiltersInMainCategory(
  categoryId: number,
  authorId: string,
) {
  return await db.query.filters.findMany({
    where: and(
      eq(filters.authorId, authorId),
      eq(filters.categoryId, categoryId),
      isNull(filters.subCategoryId),
    ),
    orderBy: filters.order,
  });
}

export async function findFiltersInSubCategory(
  subCategoryId: number,
  authorId: string,
) {
  return await db.query.filters.findMany({
    where: and(
      eq(filters.authorId, authorId),
      eq(filters.subCategoryId, subCategoryId),
    ),
    orderBy: filters.order,
  });
}

export async function findUncategorizedFilters(authorId: string) {
  return await db.query.filters.findMany({
    where: and(
      eq(filters.authorId, authorId),
      isNull(filters.categoryId),
      isNull(filters.subCategoryId),
    ),
    orderBy: filters.order,
  });
}
