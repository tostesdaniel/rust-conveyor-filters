import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { filters } from "@/db/schema";

export async function checkUserOwnsFilter(filterId: number, userId: string) {
  const result = await db.query.filters.findFirst({
    where: and(eq(filters.id, filterId), eq(filters.authorId, userId)),
  });
  return result;
}
