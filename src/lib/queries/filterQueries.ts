"use server";

import { db } from "@/db";
import { withCursorPagination } from "@/db/pagination";
import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { createServerAction } from "zsa";

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

export const getAllPublicFilters = createServerAction()
  .input(
    z.object({
      cursor: z.number().nullable().default(null),
      limit: z.number().optional().default(6),
    }),
  )
  .handler(async ({ input: { cursor, limit } }) => {
    const query = async (): Promise<ConveyorFilter[]> => {
      const whereClause = cursor
        ? and(eq(filters.isPublic, true), gt(filters.id, cursor))
        : eq(filters.isPublic, true);

      return await db.query.filters.findMany({
        where: whereClause,
        limit,
        with: {
          filterItems: {
            with: { item: true, category: true },
            orderBy: ({ createdAt, id }) => [id, createdAt],
          },
        },
        orderBy: filters.id,
      });
    };

    const publicFilters: ConveyorFilter[] = await withCursorPagination(
      query,
      cursor,
      limit,
    );

    const filterWithAuthor: ConveyorFilterWithAuthor[] = await Promise.all(
      publicFilters.map(async (filter) => {
        try {
          const user = await clerkClient().users.getUser(filter.authorId);
          const discordAccount = user.externalAccounts.find(
            (account) => account.provider === "oauth_discord",
          );
          return {
            ...filter,
            author: discordAccount ? discordAccount.username : user.username,
          };
        } catch (error) {
          return {
            ...filter,
            author: null,
          };
        }
      }),
    );

    return {
      data: filterWithAuthor,
      nextCursor:
        publicFilters.length === limit
          ? publicFilters[publicFilters.length - 1].id
          : null,
    };
  });
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
