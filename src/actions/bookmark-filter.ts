"use server";

import { bookmarkFilter, findExistingBookmark, unbookmarkFilter } from "@/data";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { authenticatedProcedure } from "@/lib/safe-action";
import { bookmarks } from "@/db/schema";

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

export const getBookmarkedStatus = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      filterId: z.number(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const bookmarked = await db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.filterId, input.filterId),
        eq(bookmarks.authorId, ctx.userId),
      ),
    });
    return { bookmarked: bookmarked ? true : false };
  });

export const getBookmarkedFilters = authenticatedProcedure
  .createServerAction()
  .handler(async ({ ctx }) => {
    return await db.query.bookmarks.findMany({
      where: eq(bookmarks.authorId, ctx.userId),
      with: {
        filter: {
          with: { filterItems: { with: { item: true, category: true } } },
        },
      },
    });
  });
