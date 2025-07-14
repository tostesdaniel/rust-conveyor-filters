"server-only";

import { db } from "@/db";

export async function getCategories() {
  return await db.query.categories.findMany();
}
