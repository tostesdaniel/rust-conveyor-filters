import "server-only";

import { db } from "@/db";
import { toSharedFilterDTO } from "@/utils/filter-mappers";
import { and, eq } from "drizzle-orm";

import type { DbTransaction } from "@/types/db-transaction";
import { sharedFilters } from "@/db/schema";

export async function findSharedFilter({
  filterId,
  shareTokenId,
}: {
  filterId: number;
  shareTokenId: number;
}) {
  return await db.query.sharedFilters.findFirst({
    where: and(
      eq(sharedFilters.filterId, filterId),
      eq(sharedFilters.shareTokenId, shareTokenId),
    ),
  });
}

export async function findSharedFilters(shareTokenId: number) {
  const result = await db.query.sharedFilters.findMany({
    where: eq(sharedFilters.shareTokenId, shareTokenId),
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

  // Map filters to DTOs while preserving userCategory structure
  return result.map((sharedFilter) => ({
    id: sharedFilter.id,
    filterId: sharedFilter.filterId,
    shareTokenId: sharedFilter.shareTokenId,
    senderId: sharedFilter.senderId,
    filter: sharedFilter.filter
      ? {
          ...toSharedFilterDTO(sharedFilter.filter),
          userCategory: sharedFilter.filter.userCategory
            ? {
                id: sharedFilter.filter.userCategory.id,
                name: sharedFilter.filter.userCategory.name,
                subCategories:
                  sharedFilter.filter.userCategory.subCategories?.map((sc) => ({
                    id: sc.id,
                    name: sc.name,
                  })) ?? [],
              }
            : null,
        }
      : null,
  }));
}

export async function createSharedFilter(
  {
    filterId,
    shareTokenId,
    senderId,
  }: {
    filterId: number;
    shareTokenId: number;
    senderId: string;
  },
  tx?: DbTransaction,
) {
  const dbInstance = tx || db;

  await dbInstance.insert(sharedFilters).values({
    filterId,
    shareTokenId,
    senderId,
  });
}

interface ReassignSharedFiltersToTokenParams {
  fromTokenId: number;
  toTokenId: number;
}

export async function reassignSharedFiltersToToken(
  { fromTokenId, toTokenId }: ReassignSharedFiltersToTokenParams,
  tx?: DbTransaction,
) {
  const dbInstance = tx || db;

  await dbInstance
    .update(sharedFilters)
    .set({
      shareTokenId: toTokenId,
    })
    .where(eq(sharedFilters.shareTokenId, fromTokenId));
}

export async function deleteSharedFilter({
  filterId,
  shareTokenId,
}: {
  filterId: number;
  shareTokenId: number;
}) {
  await db
    .delete(sharedFilters)
    .where(
      and(
        eq(sharedFilters.filterId, filterId),
        eq(sharedFilters.shareTokenId, shareTokenId),
      ),
    );
}
