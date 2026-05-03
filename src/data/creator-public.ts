import "server-only";

import { loadTagsForFilters } from "@/data/filters";
import { db } from "@/db";
import { enrichWithAuthor } from "@/utils/enrich-filter";
import { toPublicFilterDTO } from "@/utils/filter-mappers";
import { and, eq, isNull, sql } from "drizzle-orm";

import type { ConveyorFilter, PublicFilterListDTO } from "@/types/filter";
import { bookmarks, filters, userCategories } from "@/db/schema";

export type CreatorPublicStats = {
  publicFilterCount: number;
  totalViews: number;
  totalExports: number;
  bookmarkCount: number;
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
  const enriched = await enrichWithAuthor(rawFilters);
  const tagsByFilter = await loadTagsForFilters(rawFilters.map((f) => f.id));
  const map = new Map<number, PublicFilterListDTO>();
  for (const f of enriched) {
    map.set(f.id, {
      ...toPublicFilterDTO(f),
      tags: tagsByFilter.get(f.id) ?? [],
    });
  }
  return map;
}

export async function getCreatorPublicStats(
  authorId: string,
): Promise<CreatorPublicStats> {
  const [filterAgg] = await db
    .select({
      publicFilterCount: sql<number>`cast(count(*) as int)`,
      totalViews: sql<number>`cast(coalesce(sum(${filters.viewCount}), 0) as int)`,
      totalExports: sql<number>`cast(coalesce(sum(${filters.exportCount}), 0) as int)`,
    })
    .from(filters)
    .where(and(eq(filters.authorId, authorId), eq(filters.isPublic, true)));

  const [bm] = await db
    .select({
      bookmarkCount: sql<number>`cast(count(*) as int)`,
    })
    .from(bookmarks)
    .innerJoin(filters, eq(bookmarks.filterId, filters.id))
    .where(and(eq(filters.authorId, authorId), eq(filters.isPublic, true)));

  return {
    publicFilterCount: filterAgg?.publicFilterCount ?? 0,
    totalViews: filterAgg?.totalViews ?? 0,
    totalExports: filterAgg?.totalExports ?? 0,
    bookmarkCount: bm?.bookmarkCount ?? 0,
  };
}

export async function getPublicFilterHierarchyForAuthor(
  authorId: string,
): Promise<CreatorPublicHierarchy> {
  const uncategorizedRaw = await db.query.filters.findMany({
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
  });

  const categoriesRaw = await db.query.userCategories.findMany({
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
  });

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
