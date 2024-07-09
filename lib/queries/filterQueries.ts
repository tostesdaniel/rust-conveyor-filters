"use server";

import { db } from "@/db";
import { eq } from "drizzle-orm";

export async function getFiltersWithItems(userId: string) {
  return await db.query.filters.findMany({
    where: (filters) => eq(filters.authorId, userId),
    with: { filterItems: { with: { item: true } } },
  });
}
