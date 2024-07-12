"use server";

import { createFilterSchema } from "@/schemas/filterFormSchema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { filterItems, filters } from "@/db/schema";

import { db } from "../db";

export async function createFilter(formData: FormData) {
  const { userId } = auth();

  if (!userId) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  const parsed = createFilterSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    imagePath: formData.get("imagePath"),
    items: JSON.parse(formData.get("items") as string),
    isPublic: formData.get("isPublic") === "true" ? true : false,
    authorId: userId,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid form data",
    };
  }

  const newFilter = parsed.data;

  try {
    const [insertedFilter] = await db
      .insert(filters)
      .values({
        name: newFilter.name,
        description: newFilter.description,
        authorId: newFilter.authorId as string,
        imagePath: newFilter.imagePath,
        isPublic: newFilter.isPublic,
      })
      .returning();

    const filterItemsData = newFilter.items.map(
      (item: (typeof newFilter.items)[0]) => ({
        filterId: insertedFilter.id,
        itemId: item.id,
        max: item.max,
        buffer: item.buffer,
        min: item.min,
      }),
    );

    await db.insert(filterItems).values(filterItemsData);

    return {
      success: true,
      message: "Filter created successfully",
    };
  } catch (error) {
    console.error("Error creating filter:", error);
    return {
      success: false,
      message: "Failed to create filter",
    };
  }
}

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
