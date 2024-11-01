"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

import type { FilterSortOption } from "@/types/filter-sorting";
import { useServerActionInfiniteQuery } from "@/hooks/server-action-hooks";
import {
  getMostUsedFilters,
  getNewFilters,
  getPopularFilters,
  getUpdatedFilters,
} from "@/lib/queries";
import { FilterSortTabs } from "@/components/filters/filter-sort-tabs";
import FiltersLoading from "@/app/(app)/filters/loading";

import { FilterCard } from "./filter-card/filter-card";
import { FilterCardSkeleton } from "./filter-card/filter-card-skeleton";

export function FilterGrid() {
  const { ref, inView } = useInView();
  const searchParams = useSearchParams();
  const sortBy =
    searchParams.get("sort") || ("popular" as FilterSortOption["value"]);

  const queries = {
    popular: getPopularFilters,
    new: getNewFilters,
    updated: getUpdatedFilters,
    mostUsed: getMostUsedFilters,
  };
  const selectedQuery = queries[sortBy as keyof typeof queries];

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    isPlaceholderData,
  } = useServerActionInfiniteQuery(selectedQuery, {
    queryKey: ["filters", sortBy],
    initialPageParam: undefined,
    input: ({ pageParam }) => ({
      cursor: pageParam,
      pageSize: 6,
    }),
    // @ts-ignore workaround for using compound cursor
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
  });

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sortBy]);

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className='pt-4'>
      <FilterSortTabs />
      {isLoading ? (
        <FiltersLoading />
      ) : (
        <div className='grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2 lg:place-items-stretch'>
          {data?.pages
            .flatMap((page) => page.data)
            .map((filter) => (
              <div
                key={filter.id}
                className={`transition-opacity duration-300 ${
                  isPlaceholderData ? "opacity-50" : "opacity-100"
                }`}
              >
                <FilterCard filter={filter} />
              </div>
            ))}
          {isFetchingNextPage &&
            [...Array(4)].map((_, i) => <FilterCardSkeleton key={i} />)}
          <div ref={ref} />
        </div>
      )}
    </div>
  );
}
