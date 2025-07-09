"use server";

import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { asc } from "drizzle-orm";

import { items } from "@/db/schema";

export const getItems = unstable_cache(
  async () => {
    return await fetchItems();
  },
  ["items"],
  {
    revalidate: 24 * 60 * 60,
    tags: ["items"],
  },
);

async function fetchItems() {
  try {
    const result = await db
      .select()
      .from(items)
      .orderBy(asc(items.category), asc(items.name));
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: {
        message: "Failed to get items",
      },
    };
  }
}
