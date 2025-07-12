import { db } from "@/db";
import type { pooledDb } from "@/db/pooled-connection";
import { and, eq } from "drizzle-orm";

import { filters } from "@/db/schema";

type DbTransaction = Parameters<Parameters<typeof pooledDb.transaction>[0]>[0];

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
