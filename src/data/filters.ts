import { db } from "@/db";
import { and, desc, eq, isNull } from "drizzle-orm";

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

export async function getMaxOrderInCategory(
  categoryId: number,
  authorId: string,
) {
  const maxOrder = await db.query.filters.findFirst({
    where: and(
      eq(filters.authorId, authorId),
      eq(filters.categoryId, categoryId),
      isNull(filters.subCategoryId),
    ),
    orderBy: desc(filters.order),
    columns: { order: true },
  });

  return maxOrder;
}

export async function getMaxOrderInSubCategory(
  subCategoryId: number,
  authorId: string,
) {
  const maxOrder = await db.query.filters.findFirst({
    where: and(
      eq(filters.authorId, authorId),
      eq(filters.subCategoryId, subCategoryId),
    ),
    orderBy: desc(filters.order),
    columns: { order: true },
  });

  return maxOrder;
}

export async function getMaxOrderInUncategorized(authorId: string) {
  const maxOrder = await db.query.filters.findFirst({
    where: and(
      eq(filters.authorId, authorId),
      isNull(filters.categoryId),
      isNull(filters.subCategoryId),
    ),
    orderBy: desc(filters.order),
    columns: { order: true },
  });

  return maxOrder;
}

interface MoveFilterToCategoryParams {
  filterId: number;
  targetCategoryId: number;
  authorId: string;
  newOrder: number;
}

export async function moveFilterToCategory(
  data: MoveFilterToCategoryParams,
  tx?: DbTransaction,
) {
  const dbInstance = tx || db;
  const { filterId, targetCategoryId, authorId, newOrder } = data;

  await dbInstance
    .update(filters)
    .set({
      categoryId: targetCategoryId,
      subCategoryId: null, // Clear subcategory
      order: newOrder,
    })
    .where(and(eq(filters.id, filterId), eq(filters.authorId, authorId)));
}

interface MoveFilterToSubCategoryParams {
  filterId: number;
  targetSubCategoryId: number;
  parentCategoryId: number;
  authorId: string;
  newOrder: number;
}

export async function moveFilterToSubCategory(
  data: MoveFilterToSubCategoryParams,
  tx?: DbTransaction,
) {
  const dbInstance = tx || db;
  const {
    filterId,
    targetSubCategoryId,
    parentCategoryId,
    authorId,
    newOrder,
  } = data;

  await dbInstance
    .update(filters)
    .set({
      subCategoryId: targetSubCategoryId,
      categoryId: parentCategoryId,
      order: newOrder,
    })
    .where(and(eq(filters.id, filterId), eq(filters.authorId, authorId)));
}

interface MoveFilterToUncategorizedParams {
  filterId: number;
  authorId: string;
  newOrder: number;
}

export async function moveFilterToUncategorized(
  data: MoveFilterToUncategorizedParams,
  tx?: DbTransaction,
) {
  const dbInstance = tx || db;
  const { filterId, authorId, newOrder } = data;

  await dbInstance
    .update(filters)
    .set({
      categoryId: null,
      subCategoryId: null,
      order: newOrder,
    })
    .where(and(eq(filters.id, filterId), eq(filters.authorId, authorId)));
}
