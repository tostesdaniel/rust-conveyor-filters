import { authenticatedProcedure, createTRPCRouter } from "@/server/api/trpc";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { bookmarks } from "@/db/schema";

export const bookmarksRouter = createTRPCRouter({
  bookmark: authenticatedProcedure
    .input(
      z.object({
        filterId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingBookmark = await ctx.db.query.bookmarks.findFirst({
        where: and(
          eq(bookmarks.filterId, input.filterId),
          eq(bookmarks.authorId, ctx.userId),
        ),
      });
      if (existingBookmark) {
        await ctx.db
          .delete(bookmarks)
          .where(
            and(
              eq(bookmarks.filterId, existingBookmark.filterId),
              eq(bookmarks.authorId, ctx.userId),
            ),
          );
        return { bookmarked: false };
      } else {
        await ctx.db.insert(bookmarks).values({
          filterId: input.filterId,
          authorId: ctx.userId,
        });
        return { bookmarked: true };
      }
    }),

  getBookmarkedStatus: authenticatedProcedure
    .input(
      z.object({
        filterId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bookmarked = await ctx.db.query.bookmarks.findFirst({
        where: and(
          eq(bookmarks.filterId, input.filterId),
          eq(bookmarks.authorId, ctx.userId),
        ),
      });
      return { bookmarked: bookmarked ? true : false };
    }),

  getBookmarkedFilters: authenticatedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.bookmarks.findMany({
      where: eq(bookmarks.authorId, ctx.userId),
      with: {
        filter: {
          with: { filterItems: { with: { item: true, category: true } } },
        },
      },
    });
  }),
});
