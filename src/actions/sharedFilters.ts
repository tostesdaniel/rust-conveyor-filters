"use server";

import { db } from "@/db";
import { pooledDb } from "@/db/pooled-connection";
import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { ZSAError } from "zsa";

import type { ConveyorFilter } from "@/types/filter";
import { authenticatedProcedure, ownsFilterProcedure } from "@/lib/safe-action";
import { filters, sharedFilters, shareTokens } from "@/db/schema";

export const shareFilter = ownsFilterProcedure
  .createServerAction()
  .input(
    z.object({
      filterId: z.number(),
      token: z.string(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const { filterId } = input;
    try {
      await pooledDb.transaction(async (tx) => {
        const filter = await tx.query.filters.findFirst({
          where: eq(filters.id, filterId),
        });

        if (!filter) {
          throw new ZSAError("NOT_FOUND", {
            name: "Filter Not Found",
            message:
              "The filter you're trying to share could not be found. It may have been deleted or moved.",
          });
        }

        const ownToken = await tx.query.shareTokens.findFirst({
          where: and(
            eq(shareTokens.revoked, false),
            eq(shareTokens.userId, ctx.ownsFilter.authorId),
          ),
          columns: {
            token: true,
          },
        });

        if (!ownToken) {
          throw new ZSAError("NOT_FOUND", {
            name: "Missing Share Token",
            message:
              "You don't have an active share token. Please generate one,",
          });
        }

        if (input.token === ownToken.token) {
          throw new ZSAError("FORBIDDEN", {
            name: "Invalid Share Target",
            message:
              "You cannot share a filter with yourself. Please use a different share token.",
          });
        }

        const shareToken = await tx.query.shareTokens.findFirst({
          where: and(
            eq(shareTokens.revoked, false),
            eq(shareTokens.token, input.token),
          ),
          columns: {
            id: true,
          },
        });

        if (!shareToken) {
          throw new ZSAError("NOT_FOUND", {
            name: "Invalid Share Token",
            message:
              "The share token you provided is invalid or has been revoked. Please check the token and try again.",
          });
        }

        const existingSharedFilter = await tx.query.sharedFilters.findFirst({
          where: and(
            eq(sharedFilters.filterId, filterId),
            eq(sharedFilters.senderId, ctx.ownsFilter.authorId),
            eq(sharedFilters.shareTokenId, shareToken.id),
          ),
        });

        if (existingSharedFilter) {
          throw new ZSAError("CONFLICT", {
            name: "Filter Already Shared",
            message:
              "This filter is already shared with the user associated with this token.",
          });
        }

        await tx.insert(sharedFilters).values({
          senderId: ctx.ownsFilter.authorId,
          filterId,
          shareTokenId: shareToken.id,
        });
      });
    } catch (error) {
      if (error instanceof ZSAError) throw error;

      throw new ZSAError("INTERNAL_SERVER_ERROR", {
        name: "Something Went Wrong",
        message:
          "We encountered an unexpected error while sharing your filter. If the problem persists, please contact ohTostt on Discord.",
      });
    }
  });

export const shareFilterCategory = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      categoryId: z.number().nullable(),
      subCategoryId: z.number().optional(),
      includeSubcategories: z.boolean(),
      token: z.string(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const { categoryId, subCategoryId, includeSubcategories, token } = input;

    if (categoryId && subCategoryId) {
      throw new ZSAError("INPUT_PARSE_ERROR", {
        name: "Invalid Input",
        message:
          "Cannot specify both category and subcategory. If you got this error, please contact ohTostt on Discord.",
      });
    }

    if (subCategoryId && includeSubcategories) {
      throw new ZSAError("INPUT_PARSE_ERROR", {
        name: "Invalid Input",
        message:
          "Cannot specify both subcategory and includeSubcategories. If you got this error, please contact ohTostt on Discord.",
      });
    }

    try {
      return await pooledDb.transaction(async (tx) => {
        const ownToken = await tx.query.shareTokens.findFirst({
          where: and(
            eq(shareTokens.revoked, false),
            eq(shareTokens.userId, ctx.userId),
          ),
          columns: {
            token: true,
          },
        });

        if (!ownToken) {
          throw new ZSAError("NOT_FOUND", {
            name: "Missing Share Token",
            message:
              "You don't have an active share token. Please generate one,",
          });
        }

        if (input.token === ownToken.token) {
          throw new ZSAError("FORBIDDEN", {
            name: "Invalid Share Target",
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
          tx.query.shareTokens.findFirst({
            where: and(
              eq(shareTokens.revoked, false),
              eq(shareTokens.token, token),
            ),
          }),
        ]);

        if (!shareToken) {
          throw new ZSAError("NOT_FOUND", {
            name: "Invalid Share Token",
            message: "The provided share token is invalid or revoked.",
          });
        }

        if (filtersToShare.length === 0) {
          throw new ZSAError("NOT_FOUND", {
            name: "No Filters Found",
            message: "No filters found in this category to share.",
          });
        }

        const existingSharedFilters = await tx.query.sharedFilters.findMany({
          where: and(
            inArray(
              sharedFilters.filterId,
              filtersToShare.map((f) => f.id),
            ),
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
          throw new ZSAError("CONFLICT", {
            name: "All Filters Already Shared",
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

        const result = {
          totalFilters: filtersToShare.length,
          sharedCount: filtersToInsert.length,
          alreadySharedCount: existingFilterIds.size,
        };

        return result;
      });
    } catch (error) {
      if (error instanceof ZSAError) throw error;

      throw new ZSAError("INTERNAL_SERVER_ERROR", {
        name: "Server Error",
        message:
          "Failed to share filters. Please try again later. If the problem persists, please contact ohTostt on Discord.",
      });
    }
  });

export const getSharedFilters = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    const userShareToken = await db.query.shareTokens.findFirst({
      where: and(
        eq(shareTokens.revoked, false),
        eq(shareTokens.userId, ctx.userId),
      ),
      columns: {
        id: true,
      },
    });

    if (!userShareToken) {
      throw new ZSAError("NOT_FOUND", "Token not found");
    }

    const sharedFiltersResult = await db.query.sharedFilters.findMany({
      where: eq(sharedFilters.shareTokenId, userShareToken.id),
      with: {
        filter: {
          with: {
            filterItems: {
              with: {
                item: true,
                category: true,
              },
            },
            userCategory: {
              columns: {
                id: true,
                name: true,
              },
              with: {
                subCategories: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

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
          uncategorizedFilters: ConveyorFilter[];
          categories: {
            id: number;
            name: string;
            filters: ConveyorFilter[];
            subCategories: {
              id: number;
              name: string;
              filters: ConveyorFilter[];
            }[];
          }[];
        }
      >,
    );

    return Object.values(structuredData);
  });

export const deleteSharedFilter = authenticatedProcedure
  .createServerAction()
  .input(z.object({ filterId: z.number() }))
  .handler(async ({ ctx, input }) => {
    const { filterId } = input;

    const ownShareToken = await db.query.shareTokens.findFirst({
      where: and(
        eq(shareTokens.revoked, false),
        eq(shareTokens.userId, ctx.userId),
      ),
    });

    if (!ownShareToken) {
      throw new ZSAError("NOT_FOUND", "Generate a new share token");
    }

    try {
      await db
        .delete(sharedFilters)
        .where(
          and(
            eq(sharedFilters.filterId, filterId),
            eq(sharedFilters.shareTokenId, ownShareToken.id),
          ),
        );
    } catch (error) {
      if (error instanceof ZSAError) throw error;

      throw new ZSAError(
        "INTERNAL_SERVER_ERROR",
        "Failed to delete shared filter",
      );
    }
  });
