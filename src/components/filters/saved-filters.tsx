"use client";

import { api } from "@/trpc/client";
import { BookmarkPlusIcon, GlobeIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";

import { BookmarkedFilterCard } from "../my-filters/bookmarked-filter-card";

export function SavedFilters() {
  const { data: bookmarkedFilters } =
    api.bookmarks.getBookmarkedFilters.useQuery();

  if (!bookmarkedFilters?.length) {
    return (
      <EmptyState
        Icon={BookmarkPlusIcon}
        title='No bookmarked filters'
        description='You have not bookmarked any filters yet.'
        label='Browse Filters'
        ButtonIcon={GlobeIcon}
        redirectUrl='/filters'
      />
    );
  }

  return (
    <ul
      role='list'
      className='mt-6 grid grid-cols-1 gap-5 min-[680px]:grid-cols-2 sm:gap-6 lg:grid-cols-3'
    >
      {bookmarkedFilters.map(({ filter }) => (
        <BookmarkedFilterCard key={filter.id} filter={filter} />
      ))}
    </ul>
  );
}
