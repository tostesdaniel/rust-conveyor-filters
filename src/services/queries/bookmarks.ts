"use server";

import { getBookmarkedFilters as getBookmarkedFiltersDb } from "@/data";

import { authenticatedProcedure } from "@/lib/safe-action";

export const getBookmarkedFilters = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await getBookmarkedFiltersDb(ctx.userId);
  });
