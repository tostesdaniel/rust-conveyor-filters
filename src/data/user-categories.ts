"server-only";

import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { subCategories, userCategories } from "@/db/schema";

export async function createUserCategory(name: string, userId: string) {
  return await db
    .insert(userCategories)
    .values({
      name,
      userId,
    })
    .returning();
}

export async function createSubCategory(
  name: string,
  userId: string,
  parentId: number,
) {
  return await db
    .insert(subCategories)
    .values({
      name,
      userId,
      parentId,
    })
    .returning();
}

export async function findExistingUserCategory(name: string, userId: string) {
  return await db.query.userCategories.findFirst({
    where: and(
      eq(userCategories.name, name),
      eq(userCategories.userId, userId),
    ),
  });
}

export async function findExistingSubCategory(
  name: string,
  userId: string,
  parentId: number,
) {
  return await db.query.subCategories.findFirst({
    where: and(
      eq(subCategories.name, name),
      eq(subCategories.userId, userId),
      eq(subCategories.parentId, parentId),
    ),
  });
}

export async function findParentCategoryById(parentId: number) {
  return await db.query.userCategories.findFirst({
    where: eq(userCategories.id, parentId),
  });
}
