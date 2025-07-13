"server-only";

import { db } from "@/db";
import { eq } from "drizzle-orm";

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
