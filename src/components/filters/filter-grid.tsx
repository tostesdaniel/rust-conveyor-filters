"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";

import type { ConveyorFilterWithAuthor } from "@/types/filter";
import type { FilterSortOption } from "@/types/filter-sorting";
import { useFilters } from "@/hooks/use-filters";
import { Typography } from "@/components/ui/typography";
import { FilterSortTabs } from "@/components/filters/filter-sort-tabs";
import FiltersLoading from "@/app/(app)/filters/loading";

import { FilterCard } from "./filter-card/filter-card";
import { FilterCardSkeleton } from "./filter-card/filter-card-skeleton";

export function FilterGrid() {
  const { ref, inView } = useInView({
    delay: 100,
    triggerOnce: false,
    threshold: 0.5,
  });
  const searchParams = useSearchParams();
  const sortBy = (searchParams.get("sort") ||
    "popular") as FilterSortOption["value"];

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    isPlaceholderData,
  } = useFilters(sortBy);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sortBy]);

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch((err) => {
        console.error("Failed to fetch next page:", err);
      });
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  if (isError) {
    return (
      <div className='p-4 text-center'>
        <Typography variant='h4' className='text-red-500'>
          Error loading filters
        </Typography>
        <Typography variant='p' className='mt-2'>
          {error.message}
        </Typography>
        <button
          onClick={() => window.location.reload()}
          className='mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90'
        >
          Try Again
        </button>
      </div>
    );
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
            .map((filter: ConveyorFilterWithAuthor) => (
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
