"use server";

import { db } from "@/db";
import { asc } from "drizzle-orm";

import { items } from "@/db/schema";

export async function getItems() {
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
