"server-only";

import { db } from "@/db";
import { and, eq, isNull } from "drizzle-orm";

import { filters, subCategories, userCategories } from "@/db/schema";

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

export async function getUserCategoryHierarchy(userId: string) {
  return await db.query.userCategories.findMany({
    where: eq(userCategories.userId, userId),
    with: {
      filters: {
        where: isNull(filters.subCategoryId),
        with: {
          filterItems: {
            with: { category: true, item: true },
          },
        },
        orderBy: filters.order,
      },
      subCategories: {
        with: {
          filters: {
            with: {
              filterItems: {
                with: { category: true, item: true },
              },
            },
            orderBy: filters.order,
          },
        },
      },
    },
  });
}

export async function getUserCategories(userId: string) {
  return await db.query.userCategories.findMany({
    where: eq(userCategories.userId, userId),
    with: { subCategories: true },
  });
}
