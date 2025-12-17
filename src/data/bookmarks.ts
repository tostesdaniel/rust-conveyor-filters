import "server-only";

import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { bookmarks } from "@/db/schema";
import { toPublicFilterDTO } from "@/data/filters";
import { enrichWithAuthor } from "@/utils/enrich-filter";
import type { BookmarkDTO } from "@/types/dto/bookmark";

/**
 * Create a bookmark linking a filter to an author.
 *
 * @param filterId - ID of the filter to bookmark
 * @param authorId - ID of the author creating the bookmark
 */
export async function bookmarkFilter(filterId: number, authorId: string) {
  await db.insert(bookmarks).values({
    filterId,
    authorId,
  });
}

/**
 * Fetches the first bookmark that links a specific filter to a specific author.
 *
 * @param filterId - The ID of the filter to match
 * @param authorId - The ID of the author who bookmarked the filter
 * @returns The matching bookmark record, or `null`/`undefined` if none exists
 */
export async function findExistingBookmark(filterId: number, authorId: string) {
  return await db.query.bookmarks.findFirst({
    where: and(
      eq(bookmarks.filterId, filterId),
      eq(bookmarks.authorId, authorId),
    ),
  });
}

/**
 * Retrieve bookmarked filters for the specified author, returning each bookmark with its filter converted to a public DTO and enriched with author data.
 *
 * @param authorId - The author's unique identifier used to find their bookmarks
 * @returns An array of `BookmarkDTO` objects, each containing the bookmark `id`, `filterId`, and the corresponding filter as a public DTO enriched with author information
 */
export async function getBookmarkedFilters(authorId: string): Promise<BookmarkDTO[]> {
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

/**
 * Remove a bookmark linking a filter to an author.
 *
 * @param filterId - The identifier of the filter to remove from the author's bookmarks
 * @param authorId - The identifier of the author whose bookmark should be removed
 */
export async function unbookmarkFilter(filterId: number, authorId: string) {
  await db
    .delete(bookmarks)
    .where(
      and(eq(bookmarks.filterId, filterId), eq(bookmarks.authorId, authorId)),
    );
}