import {
  createSharedFilter,
  deleteSharedFilter,
  findExistingFilter,
  findSharedFilter,
  findSharedFilters,
  findShareToken,
  findShareTokenByToken,
  findShareTokenId,
} from "@/data";
import { db } from "@/db";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { z } from "zod";

import type { SharedFilterDTO } from "@/types/filter";
import { filters, sharedFilters } from "@/db/schema";

import {
  createTRPCRouter,
  ownsFilterProcedure,
  protectedProcedure,
} from "../trpc";

type SharedFilterWithCategory = SharedFilterDTO & {
  userCategory: {
    id: number;
    name: string;
    subCategories: Array<{ id: number; name: string }>;
  } | null;
};

export const sharedFilterRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userShareToken = await findShareTokenId(ctx.userId);

    if (!userShareToken) {
      return [];
    }

    const sharedFiltersResult = await findSharedFilters(userShareToken.id);

    const client = await clerkClient();
    const senderIds = [...new Set(sharedFiltersResult.map((f) => f.senderId))];
    const senderUsernames = await Promise.all(
      senderIds.map(async (senderId) => {
        const { username } = await client.users.getUser(senderId);
        return { senderId, username };
      }),
    );

    const senderMap = Object.fromEntries(
      senderUsernames.map(({ senderId, username }) => [
        senderId,
        username as string,
      ]),
    );

    const structuredData = sharedFiltersResult.reduce(
      (acc, sharedFilter) => {
        const { senderId, filter } = sharedFilter;
        const senderUsername = senderMap[senderId] ?? "Unknown User";

        if (!filter) {
          return acc;
        }

        if (!acc[senderUsername]) {
          acc[senderUsername] = {
            senderUsername,
            uncategorizedFilters: [],
            categories: [],
          };
        }

        const senderGroup = acc[senderUsername];

        // Handle uncategorized filters
        if (!filter.categoryId) {
          senderGroup.uncategorizedFilters.push(filter);
          return acc;
        }

        // Find or create category
        let category = senderGroup.categories.find(
          (c) => c.id === filter.categoryId,
        );
        if (!category) {
          category = {
            id: filter.categoryId,
            name: filter.userCategory?.name ?? "Unknown Category",
            filters: [],
            subCategories: [],
          };
          senderGroup.categories.push(category);
        }

        // Handle subcategories
        if (filter.subCategoryId) {
          let subCategory = category.subCategories.find(
            (sc) => sc.id === filter.subCategoryId,
          );

          if (!subCategory) {
            subCategory = {
              id: filter.subCategoryId,
              name:
                filter.userCategory?.subCategories?.find(
                  (sc) => sc.id === filter.subCategoryId,
                )?.name ?? "Unknown Subcategory",
              filters: [],
            };
            category.subCategories.push(subCategory);
          }
          subCategory.filters.push(filter);
        } else {
          category.filters.push(filter);
        }

        return acc;
      },
      {} as Record<
        string,
        {
          senderUsername: string;
          uncategorizedFilters: SharedFilterWithCategory[];
          categories: {
            id: number;
            name: string;
            filters: SharedFilterWithCategory[];
            subCategories: {
              id: number;
              name: string;
              filters: SharedFilterWithCategory[];
            }[];
          }[];
        }
      >,
    );

    return Object.values(structuredData);
  }),

  share: ownsFilterProcedure
    .input(
      z.object({
        filterId: z.number(),
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { filterId } = input;
      try {
        await db.transaction(async (tx) => {
          const filter = await findExistingFilter(filterId, ctx.userId);

          if (!filter) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "The filter you're trying to share could not be found. It may have been deleted or moved.",
            });
          }

          const ownToken = await findShareToken(ctx.userId);

          if (!ownToken) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "You don't have an active share token. Please generate one.",
            });
          }

          if (input.token === ownToken.token) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "You cannot share a filter with yourself. Please use a different share token.",
            });
          }

          const shareToken = await findShareTokenByToken(input.token);

          if (!shareToken) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "The share token you provided is invalid or has been revoked. Please check the token and try again.",
            });
          }

          const existingSharedFilter = await findSharedFilter({
            filterId,
            shareTokenId: shareToken.id,
          });

          if (existingSharedFilter) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This filter is already shared with the user associated with this token.",
            });
          }

          await createSharedFilter(
            {
              filterId,
              shareTokenId: shareToken.id,
              senderId: ctx.userId,
            },
            tx,
          );
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "We encountered an unexpected error while sharing your filter. If the problem persists, please contact ohTostt on Discord.",
        });
      }
    }),

  shareCategory: protectedProcedure
    .input(
      z.object({
        categoryId: z.number().nullable(),
        subCategoryId: z.number().optional(),
        includeSubcategories: z.boolean(),
        token: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { categoryId, subCategoryId, includeSubcategories, token } = input;

      if (categoryId && subCategoryId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot specify both category and subcategory. If you got this error, please contact ohTostt on Discord.",
        });
      }

      if (subCategoryId && includeSubcategories) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot specify both subcategory and includeSubcategories. If you got this error, please contact ohTostt on Discord.",
        });
      }

      try {
        return await db.transaction(async (tx) => {
          const ownToken = await findShareToken(ctx.userId);

          if (!ownToken) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "You don't have an active share token. Please generate one.",
            });
          }

          if (input.token === ownToken.token) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "You cannot share a filter with yourself. Please use a different share token.",
            });
          }

          const [filtersToShare, shareToken] = await Promise.all([
            tx.query.filters.findMany({
              where: and(
                eq(filters.authorId, ctx.userId),
                categoryId === null
                  ? isNull(filters.categoryId)
                  : subCategoryId
                    ? eq(filters.subCategoryId, subCategoryId)
                    : and(
                        eq(filters.categoryId, categoryId),
                        includeSubcategories
                          ? or(
                              isNotNull(filters.subCategoryId),
                              eq(filters.categoryId, categoryId),
                            )
                          : isNull(filters.subCategoryId),
                      ),
              ),
            }),
            findShareTokenByToken(token),
          ]);

          if (!shareToken) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "The provided share token is invalid or revoked.",
            });
          }

          if (filtersToShare.length === 0) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "No filters found in this category to share.",
            });
          }

          const existingSharedFilters = await tx.query.sharedFilters.findMany({
            where: and(
              inArray(
                sharedFilters.filterId,
                filtersToShare.map((f) => f.id),
              ),
              eq(sharedFilters.shareTokenId, shareToken.id),
              eq(sharedFilters.senderId, ctx.userId),
            ),
          });

          const existingFilterIds = new Set(
            existingSharedFilters.map((f) => f.filterId),
          );
          const filtersToInsert = filtersToShare.filter(
            (f) => !existingFilterIds.has(f.id),
          );

          if (filtersToInsert.length === 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "All filters in this category are already shared with this user.",
            });
          }

          await tx.insert(sharedFilters).values(
            filtersToInsert.map((f) => ({
              senderId: ctx.userId,
              filterId: f.id,
              shareTokenId: shareToken.id,
            })),
          );

          return {
            totalFilters: filtersToShare.length,
            sharedCount: filtersToInsert.length,
            alreadySharedCount: existingFilterIds.size,
          };
        });
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to share filters. Please try again later. If the problem persists, please contact ohTostt on Discord.",
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ filterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { filterId } = input;

      const ownShareToken = await findShareToken(ctx.userId);

      if (!ownShareToken) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Generate a new share token",
        });
      }

      try {
        await deleteSharedFilter({
          filterId,
          shareTokenId: ownShareToken.id,
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete shared filter",
        });
      }
    }),
});
