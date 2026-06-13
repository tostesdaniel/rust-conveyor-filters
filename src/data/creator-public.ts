import "server-only";

import {
  loadForkAttributions,
  loadRemixCounts,
  loadTagsForFilters,
} from "@/data/filters";
import { db } from "@/db";
import { enrichWithAuthor } from "@/utils/enrich-filter";
import { toPublicFilterDTO } from "@/utils/filter-mappers";
import { clerkClient, type User } from "@clerk/nextjs/server";
import { and, eq, isNull, max, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type { ConveyorFilter, PublicFilterListDTO } from "@/types/filter";
import { bookmarks, filters, userCategories } from "@/db/schema";

export type CreatorPublicStats = {
  publicFilterCount: number;
  totalViews: number;
  totalExports: number;
  bookmarkCount: number;
  totalRemixes: number;
};

export type CreatorPublicSubCategory = {
  id: number;
  name: string;
  filters: PublicFilterListDTO[];
};

export type CreatorPublicCategory = {
  id: number;
  name: string;
  filters: PublicFilterListDTO[];
  subCategories: CreatorPublicSubCategory[];
};

export type CreatorPublicHierarchy = {
  uncategorized: PublicFilterListDTO[];
  categories: CreatorPublicCategory[];
};

async function mapFiltersToPublicDTOs(
  rawFilters: ConveyorFilter[],
): Promise<Map<number, PublicFilterListDTO>> {
  if (rawFilters.length === 0) {
    return new Map();
  }
  const filterIds = rawFilters.map((f) => f.id);
  const [enriched, tagsByFilter, remixCounts, forkAttributions] =
    await Promise.all([
      enrichWithAuthor(rawFilters),
      loadTagsForFilters(filterIds),
      loadRemixCounts(filterIds),
      loadForkAttributions(rawFilters),
    ]);
  const map = new Map<number, PublicFilterListDTO>();
  for (const f of enriched) {
    map.set(f.id, {
      ...toPublicFilterDTO(f),
      tags: tagsByFilter.get(f.id) ?? [],
      remixCount: remixCounts.get(f.id) ?? 0,
      forkedFrom: forkAttributions.get(f.id) ?? null,
    });
  }
  return map;
}

export async function getCreatorPublicStats(
  authorId: string,
): Promise<CreatorPublicStats> {
  // Count forks of this author's public filters: join each fork back to its
  // source and keep only sources that are the author's and public.
  const sourceFilters = alias(filters, "remix_source_filters");

  const [[filterAgg], [bm], [remixAgg]] = await Promise.all([
    db
      .select({
        publicFilterCount: sql<number>`cast(count(*) as int)`,
        totalViews: sql<number>`cast(coalesce(sum(${filters.viewCount}), 0) as int)`,
        totalExports: sql<number>`cast(coalesce(sum(${filters.exportCount}), 0) as int)`,
      })
      .from(filters)
      .where(and(eq(filters.authorId, authorId), eq(filters.isPublic, true))),
    db
      .select({
        bookmarkCount: sql<number>`cast(count(*) as int)`,
      })
      .from(bookmarks)
      .innerJoin(filters, eq(bookmarks.filterId, filters.id))
      .where(and(eq(filters.authorId, authorId), eq(filters.isPublic, true))),
    db
      .select({
        totalRemixes: sql<number>`cast(count(*) as int)`,
      })
      .from(filters)
      .innerJoin(sourceFilters, eq(filters.forkedFromId, sourceFilters.id))
      .where(
        and(
          eq(sourceFilters.authorId, authorId),
          eq(sourceFilters.isPublic, true),
        ),
      ),
  ]);

  return {
    publicFilterCount: filterAgg?.publicFilterCount ?? 0,
    totalViews: filterAgg?.totalViews ?? 0,
    totalExports: filterAgg?.totalExports ?? 0,
    bookmarkCount: bm?.bookmarkCount ?? 0,
    totalRemixes: remixAgg?.totalRemixes ?? 0,
  };
}

export async function getPublicFilterHierarchyForAuthor(
  authorId: string,
): Promise<CreatorPublicHierarchy> {
  const [uncategorizedRaw, categoriesRaw] = await Promise.all([
    db.query.filters.findMany({
      where: and(
        eq(filters.authorId, authorId),
        eq(filters.isPublic, true),
        isNull(filters.categoryId),
        isNull(filters.subCategoryId),
      ),
      with: {
        filterItems: {
          with: {
            item: true,
            category: true,
          },
          orderBy: ({ createdAt, id }) => [id, createdAt],
        },
      },
      orderBy: filters.order,
    }),
    db.query.userCategories.findMany({
      where: eq(userCategories.userId, authorId),
      with: {
        filters: {
          where: and(
            eq(filters.authorId, authorId),
            eq(filters.isPublic, true),
            isNull(filters.subCategoryId),
          ),
          with: {
            filterItems: {
              with: {
                item: true,
                category: true,
              },
              orderBy: ({ createdAt, id }) => [id, createdAt],
            },
          },
          orderBy: filters.order,
        },
        subCategories: {
          with: {
            filters: {
              where: and(
                eq(filters.authorId, authorId),
                eq(filters.isPublic, true),
              ),
              with: {
                filterItems: {
                  with: {
                    item: true,
                    category: true,
                  },
                  orderBy: ({ createdAt, id }) => [id, createdAt],
                },
              },
              orderBy: filters.order,
            },
          },
        },
      },
    }),
  ]);

  const allRaw: ConveyorFilter[] = [...uncategorizedRaw];
  for (const cat of categoriesRaw) {
    allRaw.push(...cat.filters);
    for (const sub of cat.subCategories) {
      allRaw.push(...sub.filters);
    }
  }

  const dtoById = await mapFiltersToPublicDTOs(allRaw);

  const uncategorized = uncategorizedRaw
    .map((f) => dtoById.get(f.id))
    .filter((dto): dto is PublicFilterListDTO => dto != null);

  const categories: CreatorPublicCategory[] = [];
  for (const cat of categoriesRaw) {
    const mainFilters = cat.filters
      .map((f) => dtoById.get(f.id))
      .filter((dto): dto is PublicFilterListDTO => dto != null);
    const subCategories: CreatorPublicSubCategory[] = [];
    for (const sub of cat.subCategories) {
      const subFilters = sub.filters
        .map((f) => dtoById.get(f.id))
        .filter((dto): dto is PublicFilterListDTO => dto != null);
      if (subFilters.length > 0) {
        subCategories.push({
          id: sub.id,
          name: sub.name,
          filters: subFilters,
        });
      }
    }
    if (mainFilters.length === 0 && subCategories.length === 0) {
      continue;
    }
    categories.push({
      id: cat.id,
      name: cat.name,
      filters: mainFilters,
      subCategories,
    });
  }

  return { uncategorized, categories };
}

export type PublicCreatorSitemapEntry = {
  username: string;
  lastModified: Date;
};

// Clerk's getUserList caps at 500 ids per request; stay well under it.
const CLERK_USER_CHUNK = 100;

/**
 * List every creator that has at least one public filter, resolved to their
 * current Clerk username, with the most recent public-filter update time as
 * `lastModified`. Used to populate `/users/[username]` entries in the sitemap.
 */
export async function getPublicCreatorSitemapEntries(): Promise<
  PublicCreatorSitemapEntry[]
> {
  const authors = await db
    .select({
      authorId: filters.authorId,
      lastModified: max(filters.updatedAt),
    })
    .from(filters)
    .where(eq(filters.isPublic, true))
    .groupBy(filters.authorId);

  if (authors.length === 0) {
    return [];
  }

  const lastModifiedById = new Map(
    authors.map((a) => [a.authorId, a.lastModified ?? new Date()]),
  );
  const authorIds = authors.map((a) => a.authorId);

  const client = await clerkClient();
  const entries: PublicCreatorSitemapEntry[] = [];

  for (let i = 0; i < authorIds.length; i += CLERK_USER_CHUNK) {
    const chunk = authorIds.slice(i, i + CLERK_USER_CHUNK);
    let users: User[] = [];
    try {
      const res = await client.users.getUserList({
        userId: chunk,
        limit: CLERK_USER_CHUNK,
      });
      users = res.data;
    } catch {
      // Skip this chunk on transient Clerk errors rather than failing the
      // whole sitemap build.
      continue;
    }

    for (const user of users) {
      if (!user.username) {
        continue;
      }
      entries.push({
        username: user.username,
        lastModified: lastModifiedById.get(user.id) ?? new Date(),
      });
    }
  }

  return entries;
}
