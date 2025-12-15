import "server-only";

import { db } from "@/db";

export async function getItems() {
  return await db.query.items.findMany({
    orderBy: (items, { asc }) => [asc(items.name)],
  });
}
