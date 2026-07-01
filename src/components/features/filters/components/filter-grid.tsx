"use client";

import * as React from "react";
import { RotateCcw, Search } from "lucide-react";
import { useInView } from "react-intersection-observer";

import { pineConfig } from "@/config/pine";
import { planWovenGrid } from "@/config/pine-weave";
import { useFilters } from "@/hooks/use-filters";
import { useSearchParams } from "@/hooks/useSearchParams";
import { FilterCard } from "@/components/features/filters/filter-card/filter-card";
import { FilterCardSkeleton } from "@/components/features/filters/filter-card/filter-card-skeleton";
import { PineBand } from "@/components/pine/pine-band";
import { EmptyState } from "@/components/shared/empty-state";
import { Typography } from "@/components/shared/typography";
import FiltersLoading from "@/app/(app)/(sidebar-layout)/filters/loading";

export function FilterGrid() {
  const { ref, inView } = useInView({
    delay: 100,
    triggerOnce: false,
    threshold: 0.5,
  });
  const [{ sort, search, categories, items, tags }] = useSearchParams();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    isPlaceholderData,
  } = useFilters(sort, search, categories, items, tags);

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
          type='button'
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

  // Interleave sponsored Pine bands into the filter list at the configured
  // cadence; deterministic, so pagination never reshuffles existing nodes.
  const wovenItems = planWovenGrid(allFilters, pineConfig);

  return (
    <>
      {isLoading ? (
        <FiltersLoading />
      ) : hasFilters ? (
        <div className='grid grid-cols-1 gap-4 pb-6 lg:grid-cols-2 lg:pb-16'>
          {wovenItems.map((item) =>
            item.kind === "band" ? (
              // Partner placement: spans the full grid width and never dims —
              // it is first-party content, shown to everyone (no ad-free
              // gating), and would look broken if dimmed during refetch.
              <div
                key={item.key}
                className='max-w-(--breakpoint-sm) lg:col-span-2 lg:max-w-none'
              >
                <PineBand
                  placement='woven-band'
                  creative={pineConfig.creatives[item.creativeIndex]}
                />
              </div>
            ) : (
              <div
                key={item.filter.id}
                className={`transition-opacity duration-300 ${
                  isPlaceholderData ? "opacity-50" : "opacity-100"
                }`}
              >
                <FilterCard filter={item.filter} />
              </div>
            ),
          )}
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
    </>
  );
}
