"server-only";

import { db } from "@/db";
import { eq } from "drizzle-orm";

import type { DbTransaction } from "@/types/db-transaction";
import { sharedFilters } from "@/db/schema";

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
