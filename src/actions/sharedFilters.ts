"use server";

import { db } from "@/db";
import { pooledDb } from "@/db/pooled-connection";
import { clerkClient } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
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
          throw new ZSAError("NOT_FOUND", "Filter not found");
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
        if (input.token === ownToken?.token!) {
          throw new ZSAError(
            "FORBIDDEN",
            "You cannot share a filter with yourself",
          );
        }
        const existingSharedFilter = await tx.query.sharedFilters.findFirst({
          where: eq(sharedFilters.filterId, filterId),
        });
        if (existingSharedFilter) {
          throw new ZSAError(
            "CONFLICT",
            "Filter already shared with this user",
          );
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
          throw new ZSAError("NOT_FOUND", "Invalid share token");
        }

        await tx.insert(sharedFilters).values({
          senderId: ctx.ownsFilter.authorId,
          filterId,
          shareTokenId: shareToken.id,
        });
      });
    } catch (error) {
      if (error instanceof ZSAError) throw error;

      throw new ZSAError("INTERNAL_SERVER_ERROR", "Failed to share filter");
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
