import "server-only";

import { db } from "@/db";
import { toOwnerFilterDTO } from "@/utils/filter-mappers";
import { and, eq, isNull } from "drizzle-orm";

import type { DbTransaction } from "@/types/db-transaction";
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

export async function findSubCategoryById(
  subCategoryId: number,
  userId: string,
) {
  return await db.query.subCategories.findFirst({
    where: and(
      eq(subCategories.id, subCategoryId),
      eq(subCategories.userId, userId),
    ),
  });
}

export async function getUserCategoryHierarchy(userId: string) {
  const result = await db.query.userCategories.findMany({
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

  return result.map((category) => ({
    ...category,
    filters: category.filters.map(toOwnerFilterDTO),
    subCategories: category.subCategories.map((subCategory) => ({
      ...subCategory,
      filters: subCategory.filters.map(toOwnerFilterDTO),
    })),
  }));
}

export async function getUserCategories(userId: string) {
  return await db.query.userCategories.findMany({
    where: eq(userCategories.userId, userId),
    with: { subCategories: true },
  });
}

interface RenameSubCategoryParams {
  subCategoryId: number;
  name: string;
  userId: string;
}

export async function renameSubCategory({
  name,
  subCategoryId,
  userId,
}: RenameSubCategoryParams) {
  return await db
    .update(subCategories)
    .set({ name })
    .where(
      and(
        eq(subCategories.id, subCategoryId),
        eq(subCategories.userId, userId),
      ),
    );
}

interface RenameMainCategoryParams {
  categoryId: number;
  name: string;
  userId: string;
}

export async function renameMainCategory({
  categoryId,
  name,
  userId,
}: RenameMainCategoryParams) {
  return await db
    .update(userCategories)
    .set({ name })
    .where(
      and(eq(userCategories.id, categoryId), eq(userCategories.userId, userId)),
    );
}

export async function deleteSubCategory(
  subCategoryId: number,
  userId: string,
  tx?: DbTransaction,
) {
  const dbInstance = tx || db;
  return await dbInstance
    .delete(subCategories)
    .where(
      and(
        eq(subCategories.id, subCategoryId),
        eq(subCategories.userId, userId),
      ),
    );
}

export async function deleteMainCategory(
  categoryId: number,
  userId: string,
  tx?: DbTransaction,
) {
  const dbInstance = tx || db;
  return await dbInstance
    .delete(userCategories)
    .where(
      and(eq(userCategories.id, categoryId), eq(userCategories.userId, userId)),
    );
}
