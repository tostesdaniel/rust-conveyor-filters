import { db } from "@/db";
import { eq } from "drizzle-orm";

import { FilterWithItemIds } from "@/types/filter";

export async function getFiltersById(
  userId: string,
): Promise<FilterWithItemIds[] | undefined> {
  return await db.query.filters.findMany({
    where: (filters) => eq(filters.authorId, userId),
    with: {
      filterItems: { columns: { itemId: true } },
    },
  });
}
