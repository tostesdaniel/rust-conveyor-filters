"use server";

import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { asc } from "drizzle-orm";

import { items } from "@/db/schema";

export async function getItems() {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: {
        message: "Unauthorized",
      },
    };
  }

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
