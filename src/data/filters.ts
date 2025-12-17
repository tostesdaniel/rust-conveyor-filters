import "server-only";

import { db } from "@/db";
import type { CursorData } from "@/utils/cursor";
import { encodeCursor } from "@/utils/cursor";
import { enrichWithAuthor } from "@/utils/enrich-filter";
import { createTsQuery } from "@/utils/text-search";
import { and, desc, eq, exists, gt, isNull, lt, or, sql } from "drizzle-orm";

import type { DbTransaction } from "@/types/db-transaction";
import type { PublicFilterListDTO } from "@/types/dto/public-filter";
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

/**
 * Retrieve a public filter by id, enrich it with author information, and return it as a public DTO.
 *
 * @param filterId - The identifier of the filter to retrieve
 * @returns A `PublicFilterListDTO` for the matching public filter, or `null` if no public filter with the given id exists
 */
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
  return toPublicFilterDTO(enriched[0]);
}

export interface GetPublicFiltersOptions {
  sort: "popular" | "new" | "updated" | "mostUsed";
  cursor?: CursorData;
  pageSize?: number;
  search?: string;
  categories?: string[];
  items?: string[];
}

/**
 * Map an enriched filter record to the public-facing filter DTO.
 *
 * Converts the enriched filter (including author and related filterItems) into a
 * PublicFilterListDTO by selecting public fields and mapping nested items and
 * categories; internal or sensitive fields are excluded.
 *
 * @param filter - An enriched filter row that includes `author` and `filterItems`
 * @returns A PublicFilterListDTO containing id, name, description, imagePath,
 * createdAt, updatedAt, author, badges, and mapped `filterItems` (with `item`,
 * `category`, `max`, `buffer`, and `min`)
 */
export function toPublicFilterDTO(
  filter: Awaited<ReturnType<typeof enrichWithAuthor>>[0],
): PublicFilterListDTO {
  return {
    id: filter.id,
    name: filter.name,
    description: filter.description,
    imagePath: filter.imagePath,
    createdAt: filter.createdAt,
    updatedAt: filter.updatedAt,
    filterItems: filter.filterItems.map((item) => ({
      item: item.item
        ? {
            name: item.item.name,
            imagePath: item.item.imagePath,
            shortname: item.item.shortname,
          }
        : null,
      category: item.category
        ? {
            name: item.category.name,
            id: item.category.id,
          }
        : null,
      max: item.max,
      buffer: item.buffer,
      min: item.min,
    })),
    author: filter.author,
    badges: filter.badges,
  };
}

/**
 * Fetches public filters applying text search, category/item filters, sorting, and cursor-based pagination.
 *
 * @param options - Query options including:
 *   - sort: one of "popular" | "new" | "updated" | "mostUsed" to determine ordering and cursor semantics
 *   - cursor: optional cursor for pagination (must match the selected `sort` to be applied)
 *   - pageSize: maximum number of filters to return (defaults to 6)
 *   - search: optional free-text search string
 *   - categories: optional list of category names to filter by presence on a filter's items
 *   - items: optional list of item names to filter by presence on a filter's items
 * @returns An object with:
 *   - `data`: an array of public filter DTOs mapped for client consumption
 *   - `nextCursor`: a minimal, sort-specific cursor string for fetching the next page, or `undefined` if there is no next page
 */
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
    // Validate cursor sort type matches current sort
    const sortMap: Record<string, "p" | "n" | "u" | "m"> = {
      popular: "p",
      new: "n",
      updated: "u",
      mostUsed: "m",
    };
    if (cursor.s === sortMap[sort]) {
      let cursorCondition;
      switch (sort) {
        case "popular":
          cursorCondition = or(
            lt(filters.popularityScore, cursor.v as number),
            and(
              eq(filters.popularityScore, cursor.v as number),
              gt(filters.id, cursor.id),
            ),
          );
          break;
        case "new":
          cursorCondition = or(
            lt(filters.createdAt, new Date(cursor.v as string)),
            and(
              eq(filters.createdAt, new Date(cursor.v as string)),
              gt(filters.id, cursor.id),
            ),
          );
          break;
        case "updated":
          cursorCondition = or(
            lt(filters.updatedAt, new Date(cursor.v as string)),
            and(
              eq(filters.updatedAt, new Date(cursor.v as string)),
              gt(filters.id, cursor.id),
            ),
          );
          break;
        case "mostUsed":
          cursorCondition = or(
            lt(filters.exportCount, cursor.v as number),
            and(
              eq(filters.exportCount, cursor.v as number),
              gt(filters.id, cursor.id),
            ),
          );
          break;
      }
      whereClause = and(...searchConditions, cursorCondition);
    }
    // If cursor doesn't match sort type, ignore it (whereClause remains unchanged)
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

  // Convert to DTOs
  const dtoFilters = enrichedFilters.map(toPublicFilterDTO);

  // Generate minimal, sort-specific cursor
  const lastItem = result[result.length - 1];
  let nextCursor: string | undefined;
  if (lastItem) {
    const sortMap: Record<string, "p" | "n" | "u" | "m"> = {
      popular: "p",
      new: "n",
      updated: "u",
      mostUsed: "m",
    };

    let cursorValue: number | string;
    switch (sort) {
      case "popular":
        cursorValue = lastItem.popularityScore ?? 0;
        break;
      case "new":
        cursorValue = lastItem.createdAt.toISOString();
        break;
      case "updated":
        cursorValue = lastItem.updatedAt.toISOString();
        break;
      case "mostUsed":
        cursorValue = lastItem.exportCount ?? 0;
        break;
    }

    const cursorData: CursorData = {
      id: lastItem.id,
      v: cursorValue,
      s: sortMap[sort],
    };

    nextCursor = encodeCursor(cursorData);
  }

  return {
    data: dtoFilters,
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