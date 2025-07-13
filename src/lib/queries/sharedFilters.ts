"use server";

import { findSharedFilters, findShareTokenId } from "@/data";
import { clerkClient } from "@clerk/nextjs/server";
import { ZSAError } from "zsa";

import type { ConveyorFilter } from "@/types/filter";
import { authenticatedProcedure } from "@/lib/safe-action";

export const getSharedFilters = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    const userShareToken = await findShareTokenId(ctx.userId);

    if (!userShareToken) {
      throw new ZSAError("NOT_FOUND", "Token not found");
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
