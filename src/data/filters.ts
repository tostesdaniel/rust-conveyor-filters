import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import type { DbTransaction } from "@/types/db-transaction";
import { filters } from "@/db/schema";

export async function findExistingFilter(
  filterId: number,
  authorId: string,
  tx?: DbTransaction,
) {
  const dbInstance = tx || db;
  return await dbInstance.query.filters.findFirst({
    where: and(eq(filters.id, filterId), eq(filters.authorId, authorId)),
  });
}
