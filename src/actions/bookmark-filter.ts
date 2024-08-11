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
