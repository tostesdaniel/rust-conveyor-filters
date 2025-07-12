import {
  getBookmarkedFilters as getBookmarkedFiltersDb,
  getBookmarkStatus,
} from "@/data";
import { z } from "zod";

import { authenticatedProcedure } from "@/lib/safe-action";

export const getBookmarkedStatus = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      filterId: z.number(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const bookmarked = await getBookmarkStatus(input.filterId, ctx.userId);
    return { bookmarked };
  });

export const getBookmarkedFilters = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await getBookmarkedFiltersDb(ctx.userId);
  });
