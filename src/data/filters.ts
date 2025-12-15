import "server-only";

import { db } from "@/db";
import { enrichWithAuthor } from "@/utils/enrich-filter";
import { createTsQuery } from "@/utils/text-search";
import { and, desc, eq, exists, gt, isNull, lt, or, sql } from "drizzle-orm";

import type { DbTransaction } from "@/types/db-transaction";
import {
  categories as categoriesTable,
  filterItems,
  filters,
  items as itemsTable,
} from "@/db/schema";

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
      updatedAt: sql`now()`,
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
      updatedAt: sql`now()`,
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
      updatedAt: sql`now()`,
    })
    .where(and(eq(filters.id, filterId), eq(filters.authorId, authorId)));
}

// Query functions

export async function getFiltersWithItems(userId: string) {
  return await db.query.filters.findMany({
    where: eq(filters.authorId, userId),
    with: {
      filterItems: {
        with: { item: true, category: true },
        orderBy: ({ createdAt, id }) => [id, createdAt],
      },
    },
  });
}

export async function getFilterById(filterId: number, userId: string) {
  return await db.query.filters.findFirst({
    where: and(eq(filters.id, filterId), eq(filters.authorId, userId)),
    with: {
      filterItems: {
        with: { item: true, category: true },
        orderBy: ({ createdAt, id }) => [id, createdAt],
      },
    },
  });
}

export async function getPublicFilter(filterId: number) {
  const filter = await db.query.filters.findFirst({
    where: and(eq(filters.id, filterId), eq(filters.isPublic, true)),
    with: {
      filterItems: {
        with: { item: true, category: true },
      },
    },
  });

  if (!filter) {
    return null;
  }

  const enriched = await enrichWithAuthor([filter]);
  return enriched[0] ?? null;
}

export interface GetPublicFiltersOptions {
  sort: "popular" | "new" | "updated" | "mostUsed";
  cursor?: {
    id: number;
    popularityScore?: number;
    createdAt?: Date;
    updatedAt?: Date;
    exportCount?: number;
  };
  pageSize?: number;
  search?: string;
  categories?: string[];
  items?: string[];
}

export async function getPublicFilters(options: GetPublicFiltersOptions) {
  const { sort, cursor, pageSize = 6, search, categories, items } = options;

  const searchConditions = [
    eq(filters.isPublic, true),
    ...(search && search !== ""
      ? [sql`${filters.searchVector} @@ ${createTsQuery(search)}`]
      : []),
    ...(categories && categories.length > 0
      ? categories.map((categoryName) =>
          exists(
            db
              .select()
              .from(filterItems)
              .innerJoin(
                categoriesTable,
                eq(filterItems.categoryId, categoriesTable.id),
              )
              .where(
                and(
                  eq(filterItems.filterId, filters.id),
                  eq(categoriesTable.name, categoryName),
                ),
              ),
          ),
        )
      : []),
    ...(items && items.length > 0
      ? items.map((itemName) =>
          exists(
            db
              .select()
              .from(filterItems)
              .innerJoin(itemsTable, eq(filterItems.itemId, itemsTable.id))
              .where(
                and(
                  eq(filterItems.filterId, filters.id),
                  eq(itemsTable.name, itemName),
                ),
              ),
          ),
        )
      : []),
  ];

  let whereClause = and(...searchConditions);
  if (cursor) {
    let cursorCondition;
    switch (sort) {
      case "popular":
        cursorCondition = or(
          lt(filters.popularityScore, cursor.popularityScore ?? 0),
          and(
            eq(filters.popularityScore, cursor.popularityScore ?? 0),
            gt(filters.id, cursor.id),
          ),
        );
        break;
      case "new":
        cursorCondition = or(
          lt(filters.createdAt, cursor.createdAt ?? new Date()),
          and(
            eq(filters.createdAt, cursor.createdAt ?? new Date()),
            gt(filters.id, cursor.id),
          ),
        );
        break;
      case "updated":
        cursorCondition = or(
          lt(filters.updatedAt, cursor.updatedAt ?? new Date()),
          and(
            eq(filters.updatedAt, cursor.updatedAt ?? new Date()),
            gt(filters.id, cursor.id),
          ),
        );
        break;
      case "mostUsed":
        cursorCondition = or(
          lt(filters.exportCount, cursor.exportCount ?? 0),
          and(
            eq(filters.exportCount, cursor.exportCount ?? 0),
            gt(filters.id, cursor.id),
          ),
        );
        break;
    }
    whereClause = and(...searchConditions, cursorCondition);
  }

  let orderBy;
  switch (sort) {
    case "popular":
      orderBy = [desc(filters.popularityScore), filters.id];
      break;
    case "new":
      orderBy = [desc(filters.createdAt), filters.id];
      break;
    case "updated":
      orderBy = [desc(filters.updatedAt), filters.id];
      break;
    case "mostUsed":
      orderBy = [desc(filters.exportCount), filters.id];
      break;
    default:
      orderBy = [desc(filters.popularityScore), filters.id];
  }

  const result = await db.query.filters.findMany({
    where: whereClause,
    limit: pageSize,
    with: {
      filterItems: {
        with: { item: true, category: true },
        orderBy: ({ createdAt, id }) => [id, createdAt],
      },
    },
    orderBy,
  });

  const enrichedFilters = await enrichWithAuthor(result);

  const lastItem = result[result.length - 1];
  const nextCursor = lastItem
    ? {
        id: lastItem.id,
        popularityScore: lastItem.popularityScore,
        createdAt: lastItem.createdAt,
        updatedAt: lastItem.updatedAt,
        exportCount: lastItem.exportCount,
      }
    : undefined;

  return {
    data: enrichedFilters,
    nextCursor,
  };
}

export async function getUserFiltersByCategory(
  userId: string,
  categoryId: number | null,
) {
  const whereClause =
    categoryId !== null
      ? and(eq(filters.categoryId, categoryId), eq(filters.authorId, userId))
      : and(isNull(filters.categoryId), eq(filters.authorId, userId));

  return await db.query.filters.findMany({
    where: whereClause,
    with: {
      filterItems: {
        with: { item: true, category: true },
        orderBy: ({ createdAt, id }) => [id, createdAt],
      },
    },
    orderBy: filters.order,
  });
}
