"use client";

import { useGetSharedFilters } from "@/hooks/useGetSharedFilters";
import { SharedFiltersEmptyState } from "@/components/features/my-filters/shared-filters/empty-state";
import { SharedFilters } from "@/components/features/my-filters/shared-filters/shared-filters";
import { FiltersTreeSkeleton } from "@/app/(app)/(stacked-layout)/my-filters/loading";

export function SharedFiltersTab() {
  const { data: sharedFilters, isPending } = useGetSharedFilters();

  if (isPending) {
    return <FiltersTreeSkeleton />;
  }

  if (!sharedFilters?.length) {
    return <SharedFiltersEmptyState />;
  }

  return <SharedFilters />;
}
