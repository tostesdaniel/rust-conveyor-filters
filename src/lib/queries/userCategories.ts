import { db } from "@/db";
import { eq, isNull } from "drizzle-orm";

import { authenticatedProcedure } from "@/lib/safe-action";
import { filters, userCategories } from "@/db/schema";

export const getUserCategoryHierarchy = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await db.query.userCategories.findMany({
      where: eq(userCategories.userId, ctx.userId),
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
  });

export const getUserCategories = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await db.query.userCategories.findMany({
      where: eq(userCategories.userId, ctx.userId),
      with: { subCategories: true },
    });
  });
