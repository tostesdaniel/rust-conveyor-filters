"use server";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { authenticatedProcedure } from "@/lib/safe-action";
import { bookmarks } from "@/db/schema";

export const bookmarkFilter = authenticatedProcedure
  .createServerAction()
  .input(
    z.object({
      filterId: z.number(),
    }),
  )
  .handler(async ({ ctx, input }) => {
    const existingBookmark = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.filterId, input.filterId),
    });
    if (existingBookmark) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existingBookmark.id));
      return { bookmarked: false };
    } else {
      await db.insert(bookmarks).values({
        filterId: input.filterId,
        authorId: ctx.userId,
      });
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
  .handler(async ({ input }) => {
    const bookmarked = await db.query.bookmarks.findFirst({
      where: eq(bookmarks.filterId, input.filterId),
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
