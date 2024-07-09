"use server";

import { eq } from "drizzle-orm";

import { filters } from "@/db/schema";

import { db } from "../db";

export async function deleteFilter(id: number) {
  try {
    await db.delete(filters).where(eq(filters.id, id));

    return {
      message: "Filter deleted successfully",
    };
  } catch (error) {
    throw new Error("Failed to delete filter");
  }
}
