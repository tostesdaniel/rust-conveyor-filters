import { NextResponse } from "next/server";
import { db } from "@/db";
import { and, desc, eq, gt, lt, or } from "drizzle-orm";
import { z } from "zod";

import { enrichWithAuthor } from "@/lib/utils/enrich-filter";
import { filters } from "@/db/schema";

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
  sortBy: z.enum(["popular", "new", "updated", "mostUsed"]),
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
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "popular";
    const cursor = searchParams.get("cursor");
    const pageSize = Number(searchParams.get("pageSize")) || 6;

    const validatedParams = querySchema.parse({
      sortBy,
      cursor,
      pageSize,
    });

    let query;
    switch (validatedParams.sortBy) {
      case "popular":
        query = await db.query.filters.findMany({
          where: validatedParams.cursor
            ? and(
                eq(filters.isPublic, true),
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
            : eq(filters.isPublic, true),
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
                eq(filters.isPublic, true),
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
            : eq(filters.isPublic, true),
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
                eq(filters.isPublic, true),
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
            : eq(filters.isPublic, true),
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
                eq(filters.isPublic, true),
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
            : eq(filters.isPublic, true),
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
          where: eq(filters.isPublic, true),
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

    const response = NextResponse.json({
      data: enrichedFilters,
      nextCursor,
    });

    // Add caching headers for better performance
    response.headers.set("Cache-Control", "public, s-maxage=10");

    return response;
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 },
    );
  }
}
