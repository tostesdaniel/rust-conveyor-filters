import "server-only";

import { db } from "@/db";
import { filterItemsOrderBy } from "@/data/filter-items-order";
import type { CursorData } from "@/utils/cursor";
import { encodeCursor } from "@/utils/cursor";
import {
  clerkUserToAuthorDisplay,
  enrichWithAuthor,
} from "@/utils/enrich-filter";
import { toOwnerFilterDTO, toPublicFilterDTO } from "@/utils/filter-mappers";
import { createTsQuery } from "@/utils/text-search";
import { clerkClient } from "@clerk/nextjs/server";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  gt,
  inArray,
  isNull,
  lt,
  or,
  sql,
} from "drizzle-orm";

import type { DbTransaction } from "@/types/db-transaction";
import {
  categories as categoriesTable,
  filterItems,
  filters,
  filterTagAssignments,
  filterTags,
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

/** A source filter's items, shaped for copying into a fork. */
interface ForkSourceItem {
  itemId: number | null;
  categoryId: number | null;
  max: number;
  buffer: number;
  min: number;
}

interface CreateForkedFilterParams {
  userId: string;
  source: {
    id: number;
    name: string;
    description: string | null;
    imagePath: string;
    authorId: string;
  };
  sourceItems: ForkSourceItem[];
}

/**
 * Copy a source filter into a new one the user owns. The copy is private,
 * uncategorized, keeps the source name, and records lineage. The shared "Save
 * to my collection" path uses this; Remix forks through filter.create instead.
 */
export async function createForkedFilter({
  userId,
  source,
  sourceItems,
}: CreateForkedFilterParams) {
  const maxOrder = await getMaxOrderInUncategorized(userId);

  const [insertedFilter] = await db
    .insert(filters)
    .values({
      name: source.name,
      description: source.description,
      authorId: userId,
      imagePath: source.imagePath,
      isPublic: false,
      categoryId: null,
      subCategoryId: null,
      order: maxOrder ? maxOrder.order + 1 : 0,
      forkedFromId: source.id,
      forkedFromAuthorId: source.authorId,
    })
    .returning();

  if (sourceItems.length > 0) {
    await db.insert(filterItems).values(
      sourceItems.map((item) => ({
        filterId: insertedFilter.id,
        itemId: item.itemId,
        categoryId: item.categoryId,
        max: item.max,
        buffer: item.buffer,
        min: item.min,
      })),
    );
  }

  return insertedFilter;
}

/** Attribution for a fork whose source is public. */
export interface ForkAttribution {
  id: number;
  name: string;
  author: string | null;
  creatorUsername: string | null;
}

/**
 * Count forks per source id. Callers pass public filter ids, so the count
 * measures a public source's reach even when the forks themselves are private.
 */
export async function loadRemixCounts(filterIds: number[]) {
  if (filterIds.length === 0) return new Map<number, number>();

  const rows = await db
    .select({
      forkedFromId: filters.forkedFromId,
      count: sql<number>`count(*)::int`,
    })
    .from(filters)
    .where(inArray(filters.forkedFromId, filterIds))
    .groupBy(filters.forkedFromId);

  const byFilter = new Map<number, number>();
  for (const row of rows) {
    if (row.forkedFromId !== null) byFilter.set(row.forkedFromId, row.count);
  }
  return byFilter;
}

/**
 * Resolve attribution for fork rows. A row resolves to an attribution only when
 * its source is still public, so forks of private or deleted sources return
 * null and strangers never see a private author (ADR-0002).
 */
export async function loadForkAttributions(
  forkRows: Array<{ id: number; forkedFromId: number | null }>,
) {
  const result = new Map<number, ForkAttribution | null>();

  const sourceIds = [
    ...new Set(
      forkRows
        .map((f) => f.forkedFromId)
        .filter((id): id is number => id !== null),
    ),
  ];
  if (sourceIds.length === 0) return result;

  const sources = await db.query.filters.findMany({
    where: and(inArray(filters.id, sourceIds), eq(filters.isPublic, true)),
    columns: { id: true, name: true, authorId: true },
  });
  if (sources.length === 0) return result;

  const client = await clerkClient();
  const authorIds = [...new Set(sources.map((s) => s.authorId))];
  const usersResponse = await client.users.getUserList({ userId: authorIds });
  const userMap = new Map(usersResponse.data.map((u) => [u.id, u]));

  const sourceMap = new Map<number, ForkAttribution>(
    sources.map((s) => {
      const user = userMap.get(s.authorId);
      return [
        s.id,
        {
          id: s.id,
          name: s.name,
          author: user ? clerkUserToAuthorDisplay(user) : null,
          creatorUsername: user?.username ?? null,
        },
      ];
    }),
  );

  for (const f of forkRows) {
    if (f.forkedFromId !== null) {
      result.set(f.id, sourceMap.get(f.forkedFromId) ?? null);
    }
  }
  return result;
}

// Query functions

export async function getFiltersWithItems(userId: string) {
  const result = await db.query.filters.findMany({
    where: eq(filters.authorId, userId),
    with: {
      filterItems: {
        with: { item: true, category: true },
        orderBy: filterItemsOrderBy,
      },
    },
  });

  const forkAttributions = await loadForkAttributions(result);
  return result.map((f) => ({
    ...toOwnerFilterDTO(f),
    forkedFrom: forkAttributions.get(f.id) ?? null,
  }));
}

export async function getFilterById(filterId: number, userId: string) {
  const result = await db.query.filters.findFirst({
    where: and(eq(filters.id, filterId), eq(filters.authorId, userId)),
    with: {
      filterItems: {
        with: { item: true, category: true },
        orderBy: filterItemsOrderBy,
      },
    },
  });

  if (!result) {
    return null;
  }

  return toOwnerFilterDTO(result);
}

export async function getPublicFilter(filterId: number) {
  const filter = await db.query.filters.findFirst({
    where: and(eq(filters.id, filterId), eq(filters.isPublic, true)),
    with: {
      filterItems: {
        with: { item: true, category: true },
        orderBy: filterItemsOrderBy,
      },
    },
  });

  if (!filter) {
    return null;
  }

  const [enriched, tagsByFilter, remixCounts, forkAttributions] =
    await Promise.all([
      enrichWithAuthor([filter]),
      loadTagsForFilters([filter.id]),
      loadRemixCounts([filter.id]),
      loadForkAttributions([filter]),
    ]);
  return {
    ...toPublicFilterDTO(enriched[0]),
    tags: tagsByFilter.get(filter.id) ?? [],
    remixCount: remixCounts.get(filter.id) ?? 0,
    forkedFrom: forkAttributions.get(filter.id) ?? null,
  };
}

export interface GetPublicFiltersOptions {
  sort: "popular" | "new" | "updated" | "mostUsed";
  cursor?: CursorData;
  pageSize?: number;
  search?: string;
  categories?: string[];
  items?: string[];
  tags?: string[];
}

/**
 * Load tags for a set of filter ids, grouped by filterId. Keeps rank order.
 */
export async function loadTagsForFilters(filterIds: number[]) {
  if (filterIds.length === 0)
    return new Map<
      number,
      Array<{ slug: string; label: string; rank: number }>
    >();
  const rows = await db
    .select({
      filterId: filterTagAssignments.filterId,
      rank: filterTagAssignments.rank,
      slug: filterTags.slug,
      label: filterTags.label,
    })
    .from(filterTagAssignments)
    .innerJoin(filterTags, eq(filterTagAssignments.tagId, filterTags.id))
    .where(
      and(
        inArray(filterTagAssignments.filterId, filterIds),
        eq(filterTags.status, "active"),
      ),
    )
    .orderBy(filterTagAssignments.filterId, asc(filterTagAssignments.rank));

  const byFilter = new Map<
    number,
    Array<{ slug: string; label: string; rank: number }>
  >();
  for (const row of rows) {
    const list = byFilter.get(row.filterId) ?? [];
    list.push({ slug: row.slug, label: row.label, rank: row.rank });
    byFilter.set(row.filterId, list);
  }
  return byFilter;
}

export async function getPublicFilters(options: GetPublicFiltersOptions) {
  const {
    sort,
    cursor,
    pageSize = 6,
    search,
    categories,
    items,
    tags,
  } = options;

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
    ...(tags && tags.length > 0
      ? [
          exists(
            db
              .select()
              .from(filterTagAssignments)
              .innerJoin(
                filterTags,
                eq(filterTagAssignments.tagId, filterTags.id),
              )
              .where(
                and(
                  eq(filterTagAssignments.filterId, filters.id),
                  inArray(filterTags.slug, tags),
                  eq(filterTags.status, "active"),
                ),
              ),
          ),
        ]
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
        orderBy: filterItemsOrderBy,
      },
    },
    orderBy,
  });

  const [enrichedFilters, tagsByFilter, remixCounts, forkAttributions] =
    await Promise.all([
      enrichWithAuthor(result),
      loadTagsForFilters(result.map((r) => r.id)),
      loadRemixCounts(result.map((r) => r.id)),
      loadForkAttributions(result),
    ]);

  const dtoFilters = enrichedFilters.map((f) => ({
    ...toPublicFilterDTO(f),
    tags: tagsByFilter.get(f.id) ?? [],
    remixCount: remixCounts.get(f.id) ?? 0,
    forkedFrom: forkAttributions.get(f.id) ?? null,
  }));

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

  const result = await db.query.filters.findMany({
    where: whereClause,
    with: {
      filterItems: {
        with: { item: true, category: true },
        orderBy: filterItemsOrderBy,
      },
    },
    orderBy: filters.order,
  });

  const forkAttributions = await loadForkAttributions(result);
  return result.map((f) => ({
    ...toOwnerFilterDTO(f),
    forkedFrom: forkAttributions.get(f.id) ?? null,
  }));
}
