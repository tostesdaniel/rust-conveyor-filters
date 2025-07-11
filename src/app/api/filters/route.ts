import { NextResponse } from "next/server";
import { db } from "@/db";
import { and, desc, eq, exists, gt, lt, or, sql } from "drizzle-orm";
import { z } from "zod";

import { loadSearchParams } from "@/lib/search-params";
import { enrichWithAuthor } from "@/lib/utils/enrich-filter";
import { createTsQuery } from "@/lib/utils/text-search";
import {
  categories as categoriesTable,
  filterItems,
  filters,
  items as itemsTable,
} from "@/db/schema";

const cursorSchema = z.object({
  id: z.number(),
  popularityScore: z.number().optional(),
  createdAt: z
    .string()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)),
  updatedAt: z
    .string()
    .optional()
    .transform((date) => (date ? new Date(date) : undefined)),
  exportCount: z.number().optional(),
});

const querySchema = z.object({
  sort: z.enum(["popular", "new", "updated", "mostUsed"]),
  cursor: z
    .string()
    .nullish()
    .transform((val) =>
      val ? cursorSchema.parse(JSON.parse(val)) : undefined,
    ),
  pageSize: z.number().default(6),
});

export async function GET(request: Request) {
  try {
    const { categories, items, search, sort } = loadSearchParams(request);
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const pageSize = Number(searchParams.get("pageSize")) || 6;

    const validatedParams = querySchema.parse({
      sort,
      cursor,
      pageSize,
    });

    const searchConditions = [
      eq(filters.isPublic, true),
      ...(search !== ""
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

    let query;
    switch (validatedParams.sort) {
      case "popular":
        query = await db.query.filters.findMany({
          where: validatedParams.cursor
            ? and(
                ...searchConditions,
                or(
                  lt(
                    filters.popularityScore,
                    validatedParams.cursor.popularityScore ?? 0,
                  ),
                  and(
                    eq(
                      filters.popularityScore,
                      validatedParams.cursor.popularityScore ?? 0,
                    ),
                    gt(filters.id, validatedParams.cursor.id),
                  ),
                ),
              )
            : and(...searchConditions),
          limit: validatedParams.pageSize,
          with: {
            filterItems: {
              with: { item: true, category: true },
              orderBy: ({ createdAt, id }) => [id, createdAt],
            },
          },
          orderBy: [desc(filters.popularityScore), filters.id],
        });
        break;
      case "new":
        query = await db.query.filters.findMany({
          where: validatedParams.cursor
            ? and(
                ...searchConditions,
                or(
                  lt(
                    filters.createdAt,
                    validatedParams.cursor.createdAt ?? new Date(),
                  ),
                  and(
                    eq(
                      filters.createdAt,
                      validatedParams.cursor.createdAt ?? new Date(),
                    ),
                    gt(filters.id, validatedParams.cursor.id),
                  ),
                ),
              )
            : and(...searchConditions),
          limit: validatedParams.pageSize,
          with: {
            filterItems: {
              with: { item: true, category: true },
              orderBy: ({ createdAt, id }) => [id, createdAt],
            },
          },
          orderBy: [desc(filters.createdAt), filters.id],
        });
        break;
      case "updated":
        query = await db.query.filters.findMany({
          where: validatedParams.cursor
            ? and(
                ...searchConditions,
                or(
                  lt(
                    filters.updatedAt,
                    validatedParams.cursor.updatedAt ?? new Date(),
                  ),
                  and(
                    eq(
                      filters.updatedAt,
                      validatedParams.cursor.updatedAt ?? new Date(),
                    ),
                    gt(filters.id, validatedParams.cursor.id),
                  ),
                ),
              )
            : and(...searchConditions),
          limit: validatedParams.pageSize,
          with: {
            filterItems: {
              with: { item: true, category: true },
              orderBy: ({ createdAt, id }) => [id, createdAt],
            },
          },
          orderBy: [desc(filters.updatedAt), filters.id],
        });
        break;
      case "mostUsed":
        query = await db.query.filters.findMany({
          where: validatedParams.cursor
            ? and(
                ...searchConditions,
                or(
                  lt(
                    filters.exportCount,
                    validatedParams.cursor.exportCount ?? 0,
                  ),
                  and(
                    eq(
                      filters.exportCount,
                      validatedParams.cursor.exportCount ?? 0,
                    ),
                    gt(filters.id, validatedParams.cursor.id),
                  ),
                ),
              )
            : and(...searchConditions),
          limit: validatedParams.pageSize,
          with: {
            filterItems: {
              with: { item: true, category: true },
              orderBy: ({ createdAt, id }) => [id, createdAt],
            },
          },
          orderBy: [desc(filters.exportCount), filters.id],
        });
        break;
      default:
        query = await db.query.filters.findMany({
          where: and(...searchConditions),
          limit: validatedParams.pageSize,
          with: {
            filterItems: {
              with: { item: true, category: true },
              orderBy: ({ createdAt, id }) => [id, createdAt],
            },
          },
        });
    }

    const enrichedFilters = await enrichWithAuthor(query);
    const lastItem = query[query.length - 1];
    const nextCursor = lastItem
      ? {
          id: lastItem.id,
          popularityScore: lastItem.popularityScore,
          createdAt: lastItem.createdAt,
          updatedAt: lastItem.updatedAt,
          exportCount: lastItem.exportCount,
        }
      : undefined;

    return NextResponse.json(
      {
        data: enrichedFilters,
        nextCursor,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 },
    );
  }
}
