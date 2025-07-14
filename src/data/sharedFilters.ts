"server-only";

import { db } from "@/db";
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
  return await db.query.sharedFilters.findMany({
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
