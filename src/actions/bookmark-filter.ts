"use server";

import { bookmarkFilter, findExistingBookmark, unbookmarkFilter } from "@/data";
import { z } from "zod";

import { authenticatedProcedure } from "@/lib/safe-action";

export const bookmarkFilterAction = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      filterId: z.number(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const existingBookmark = await findExistingBookmark(
      input.filterId,
      ctx.userId,
    );

    if (existingBookmark) {
      await unbookmarkFilter(input.filterId, ctx.userId);
      return { bookmarked: false };
    } else {
      await bookmarkFilter(input.filterId, ctx.userId);
      return { bookmarked: true };
    }
  });
