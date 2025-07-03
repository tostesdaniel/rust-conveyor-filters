"use client";

import * as React from "react";
import { RotateCcw, Search } from "lucide-react";
import { useInView } from "react-intersection-observer";

import type { ConveyorFilterWithAuthor } from "@/types/filter";
import { useFilters } from "@/hooks/use-filters";
import { useSearchParams } from "@/hooks/useSearchParams";
import { Typography } from "@/components/ui/typography";
import { EmptyState } from "@/components/empty-state";
import { FilterSortTabs } from "@/components/filters/filter-sort-tabs";
import FiltersLoading from "@/app/(app)/(sidebar-layout)/filters/loading";

import { FilterCard } from "./filter-card/filter-card";
import { FilterCardSkeleton } from "./filter-card/filter-card-skeleton";

export function FilterGrid() {
  const { ref, inView } = useInView({
    delay: 100,
    triggerOnce: false,
    threshold: 0.5,
  });
  const [{ sort, search, categories, items }] = useSearchParams();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    isPlaceholderData,
  } = useFilters(sort, search, categories, items);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sort]);

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

  const allFilters = data?.pages.flatMap((page) => page.data) || [];
  const hasFilters = allFilters.length > 0;

  return (
    <div className='-mt-0.5'>
      <React.Suspense>
        <FilterSortTabs />
      </React.Suspense>
      {isLoading ? (
        <FiltersLoading />
      ) : hasFilters ? (
        <div className='grid grid-cols-1 gap-4 py-6 lg:grid-cols-2 lg:pb-16'>
          {allFilters.map((filter: ConveyorFilterWithAuthor) => (
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
            [...Array(4)].map((_, i) => (
              <FilterCardSkeleton key={`skeleton-${i}`} />
            ))}
          <div ref={ref} />
        </div>
      ) : (
        <div className='mt-12 px-4'>
          <EmptyState
            Icon={Search}
            title='No filters found'
            description='Try adjusting your search terms or clearing filters to see more results.'
            label='Clear filters'
            ButtonIcon={RotateCcw}
            redirectUrl='/filters'
          />
        </div>
      )}
    </div>
  );
}
