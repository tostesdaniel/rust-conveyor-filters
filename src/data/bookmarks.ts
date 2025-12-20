import "server-only";

import { db } from "@/db";
import { enrichWithAuthor } from "@/utils/enrich-filter";
import { toPublicFilterDTO } from "@/utils/filter-mappers";
import { and, eq } from "drizzle-orm";

import type { BookmarkDTO } from "@/types/dto/bookmark";
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

export async function getBookmarkedFilters(
  authorId: string,
): Promise<BookmarkDTO[]> {
  const bookmarkedFilters = await db.query.bookmarks.findMany({
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

  // Enrich filters with author data and convert to DTOs
  const enrichedFilters = await enrichWithAuthor(
    bookmarkedFilters.map((bookmark) => bookmark.filter),
  );

  return bookmarkedFilters.map((bookmark, index) => ({
    id: bookmark.id,
    filterId: bookmark.filterId,
    filter: toPublicFilterDTO(enrichedFilters[index]),
  }));
}

export async function unbookmarkFilter(filterId: number, authorId: string) {
  await db
    .delete(bookmarks)
    .where(
      and(eq(bookmarks.filterId, filterId), eq(bookmarks.authorId, authorId)),
    );
}
