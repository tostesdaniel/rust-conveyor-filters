import "server-only";

import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { bookmarks } from "@/db/schema";

export async function bookmarkFilter(filterId: number, authorId: string) {
  await db.insert(bookmarks).values({
    filterId,
    authorId,
  });
}

export async function findExistingBookmark(filterId: number, authorId: string) {
  return await db.query.bookmarks.findFirst({
    where: and(
      eq(bookmarks.filterId, filterId),
      eq(bookmarks.authorId, authorId),
    ),
  });
}

export async function getBookmarkedFilters(authorId: string) {
  return await db.query.bookmarks.findMany({
    where: eq(bookmarks.authorId, authorId),
    with: {
      filter: {
        with: {
          filterItems: {
            with: { item: true, category: true },
          },
        },
      },
    },
  });
}

export async function unbookmarkFilter(filterId: number, authorId: string) {
  await db
    .delete(bookmarks)
    .where(
      and(eq(bookmarks.filterId, filterId), eq(bookmarks.authorId, authorId)),
    );
}
