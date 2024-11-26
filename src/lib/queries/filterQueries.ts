"use server";

import { db } from "@/db";
import { clerkClient } from "@clerk/nextjs/server";
import { and, desc, eq, gt, isNull, lt, or } from "drizzle-orm";
import { z } from "zod";
import { createServerAction } from "zsa";

import { BadgeType, UserBadge } from "@/types/badges";
import type { ConveyorFilter, ConveyorFilterWithAuthor } from "@/types/filter";
import { authenticatedProcedure, ownsFilterProcedure } from "@/lib/safe-action";
import { filters } from "@/db/schema";

export const getFiltersWithItems = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await db.query.filters.findMany({
      where: (filters) => eq(filters.authorId, ctx.userId),
      with: {
        filterItems: {
          with: { item: true, category: true },
          orderBy: ({ createdAt, id }) => [id, createdAt],
        },
      },
    });
  });

export const getUserFilterById = ownsFilterProcedure
  .createServerAction()
  .input(z.object({ filterId: z.number() }))
  .handler(async ({ input }) => {
    const result = await db.query.filters.findFirst({
      where: eq(filters.id, input.filterId),
      with: {
        filterItems: {
          with: { item: true, category: true },
          orderBy: ({ createdAt, id }) => [id, createdAt],
        },
      },
    });
    return result;
  });

export const getPublicFilter = createServerAction()
  .input(
    z
      .object({
        filterId: z.number(),
      })
      .optional(),
  )
  .handler(async ({ input }) => {
    if (!input?.filterId) {
      throw "Filter ID is required";
    }

    const { filterId } = input;

    const filter = await db.query.filters.findFirst({
      where: and(eq(filters.id, filterId), eq(filters.isPublic, true)),
      with: {
        filterItems: {
          with: { item: true, category: true },
        },
      },
    });

    if (!filter) {
      throw "Filter not found or is private";
    }

    return enrichWithAuthor([filter]);
  });

export const getPopularFilters = createServerAction()
  .input(
    z.object({
      cursor: z
        .object({
          id: z.number(),
          popularityScore: z.number(),
        })
        .optional(),
      pageSize: z.number().default(6),
    }),
  )
  .handler(async ({ input }) => {
    const { cursor, pageSize } = input;

    const result = await db.query.filters.findMany({
      where: cursor
        ? and(
            eq(filters.isPublic, true),
            or(
              lt(filters.popularityScore, cursor.popularityScore),
              and(
                eq(filters.popularityScore, cursor.popularityScore),
                gt(filters.id, cursor.id),
              ),
            ),
          )
        : eq(filters.isPublic, true),
      limit: pageSize,
      with: {
        filterItems: {
          with: { item: true, category: true },
          orderBy: ({ createdAt, id }) => [id, createdAt],
        },
      },
      orderBy: [desc(filters.popularityScore), filters.id],
    });

    const enrichedFilters = await enrichWithAuthor(result);

    const lastItem = result[result.length - 1];
    const nextCursor = lastItem
      ? { id: lastItem.id, popularityScore: lastItem.popularityScore }
      : undefined;

    return {
      data: enrichedFilters,
      nextCursor,
    };
  });

export const getNewFilters = createServerAction()
  .input(
    z.object({
      cursor: z
        .object({
          id: z.number(),
          createdAt: z.date(),
        })
        .optional(),
      pageSize: z.number().default(6),
    }),
  )
  .handler(async ({ input }) => {
    const { cursor, pageSize } = input;

    const result = await db.query.filters.findMany({
      where: cursor
        ? and(
            eq(filters.isPublic, true),
            or(
              lt(filters.createdAt, cursor.createdAt),
              and(
                eq(filters.createdAt, cursor.createdAt),
                gt(filters.id, cursor.id),
              ),
            ),
          )
        : eq(filters.isPublic, true),
      limit: pageSize,
      with: {
        filterItems: {
          with: { item: true, category: true },
          orderBy: ({ createdAt, id }) => [id, createdAt],
        },
      },
      orderBy: [desc(filters.createdAt), filters.id],
    });

    const enrichedFilters = await enrichWithAuthor(result);

    const lastItem = result[result.length - 1];
    const nextCursor = lastItem
      ? { id: lastItem.id, createdAt: lastItem.createdAt }
      : undefined;

    return {
      data: enrichedFilters,
      nextCursor,
    };
  });

export const getUpdatedFilters = createServerAction()
  .input(
    z.object({
      cursor: z
        .object({
          id: z.number(),
          updatedAt: z.date(),
        })
        .optional(),
      pageSize: z.number().default(6),
    }),
  )
  .handler(async ({ input }) => {
    const { cursor, pageSize } = input;

    const result = await db.query.filters.findMany({
      where: cursor
        ? and(
            eq(filters.isPublic, true),
            or(
              lt(filters.updatedAt, cursor.updatedAt),
              and(
                eq(filters.updatedAt, cursor.updatedAt),
                gt(filters.id, cursor.id),
              ),
            ),
          )
        : eq(filters.isPublic, true),
      limit: pageSize,
      with: {
        filterItems: {
          with: { item: true, category: true },
          orderBy: ({ createdAt, id }) => [id, createdAt],
        },
      },
      orderBy: [desc(filters.updatedAt), filters.id],
    });

    const enrichedFilters = await enrichWithAuthor(result);

    const lastItem = result[result.length - 1];
    const nextCursor = lastItem
      ? { id: lastItem.id, updatedAt: lastItem.updatedAt }
      : undefined;

    return {
      data: enrichedFilters,
      nextCursor,
    };
  });

export const getMostUsedFilters = createServerAction()
  .input(
    z.object({
      cursor: z
        .object({
          id: z.number(),
          exportCount: z.number(),
        })
        .optional(),
      pageSize: z.number().default(6),
    }),
  )
  .handler(async ({ input }) => {
    const { cursor, pageSize } = input;

    const result = await db.query.filters.findMany({
      where: cursor
        ? and(
            eq(filters.isPublic, true),
            or(
              lt(filters.exportCount, cursor.exportCount),
              and(
                eq(filters.exportCount, cursor.exportCount),
                gt(filters.id, cursor.id),
              ),
            ),
          )
        : eq(filters.isPublic, true),
      limit: pageSize,
      with: {
        filterItems: {
          with: { item: true, category: true },
          orderBy: ({ createdAt, id }) => [id, createdAt],
        },
      },
      orderBy: [desc(filters.exportCount), filters.id],
    });

    const enrichedFilters = await enrichWithAuthor(result);

    const lastItem = result[result.length - 1];
    const nextCursor = lastItem
      ? { id: lastItem.id, exportCount: lastItem.exportCount }
      : undefined;

    return {
      data: enrichedFilters,
      nextCursor,
    };
  });

async function enrichWithAuthor(
  filters: ConveyorFilter[],
): Promise<ConveyorFilterWithAuthor[]> {
  return Promise.all(
    filters.map(async (filter) => {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(filter.authorId);
        const discordAccount = user.externalAccounts.find(
          (account) => account.provider === "oauth_discord",
        );

        const badges: BadgeType[] = [];
        const verifiedType = user.publicMetadata.verifiedType as BadgeType;
        if (verifiedType) {
          badges.push(verifiedType);
        }
        if (user.publicMetadata.isDonator) {
          badges.push(BadgeType.DONATOR);
        }

        return {
          ...filter,
          author: discordAccount ? discordAccount.username : user.username,
          badges,
        };
      } catch (error) {
        return {
          ...filter,
          author: null,
          badges: [],
        };
      }
    }),
  );
}

export const getUserFiltersByCategory = authenticatedProcedure
  .createServerAction()
  .input(z.object({ categoryId: z.number().nullable() }))
  .handler(async ({ ctx, input }) => {
    const whereClause =
      input.categoryId !== null
        ? and(
            eq(filters.categoryId, input.categoryId),
            eq(filters.authorId, ctx.userId),
          )
        : and(isNull(filters.categoryId), eq(filters.authorId, ctx.userId));
    return await db.query.filters.findMany({
      where: whereClause,
      with: {
        filterItems: {
          with: { item: true, category: true },
          orderBy: ({ createdAt, id }) => [id, createdAt],
        },
      },
    });
  });
