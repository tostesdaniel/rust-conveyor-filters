"use client";

import { BookmarkPlusIcon, GlobeIcon } from "lucide-react";

import { useGetBookmarkedFilters } from "@/hooks/use-get-bookmarked-filters";
import { BookmarkedFilterCard } from "@/components/features/my-filters/components/bookmarked-filter-card";
import { EmptyState } from "@/components/shared/empty-state";

export function SavedFilters() {
  const { data: bookmarkedFilters } = useGetBookmarkedFilters();

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
