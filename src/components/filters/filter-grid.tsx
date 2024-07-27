"use client";

import * as React from "react";
import { useInView } from "react-intersection-observer";

import { useServerActionInfiniteQuery } from "@/hooks/server-action-hooks";
import { getAllPublicFilters } from "@/lib/queries";
import FiltersLoading from "@/app/(app)/filters/loading";

import { FilterCard } from "./filter-card/filter-card";
import { FilterCardSkeleton } from "./filter-card/filter-card-skeleton";

export function FilterGrid() {
  const { ref, inView } = useInView();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = useServerActionInfiniteQuery(getAllPublicFilters, {
    queryKey: ["filters"],
    initialPageParam: 1,
    input: ({ pageParam }) => ({
      cursor: pageParam,
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  React.useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView]);

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  if (isLoading) {
    return <FiltersLoading />;
  }

  return (
    <div className='grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2 lg:place-items-stretch'>
      {data?.pages
        .flatMap((page) => page.data)
        .map((filter) => <FilterCard key={filter.id} filter={filter} />)}
      {isFetchingNextPage &&
        [...Array(4)].map((_, i) => <FilterCardSkeleton key={i} />)}
      <div ref={ref} />
    </div>
  );
}
