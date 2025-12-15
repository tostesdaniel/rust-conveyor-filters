import {
  bookmarkFilter,
  findExistingBookmark,
  getBookmarkedFilters,
  unbookmarkFilter,
} from "@/data/bookmarks";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const bookmarkRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return getBookmarkedFilters(ctx.userId);
  }),

  toggle: protectedProcedure
    .input(
      z.object({
        filterId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
    }),
});
