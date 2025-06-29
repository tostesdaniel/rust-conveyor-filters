"use client";

import { useGetSharedFilters } from "@/hooks/useGetSharedFilters";
import { FiltersTreeSkeleton } from "@/app/(app)/(stacked-layout)/my-filters/loading";

import { SharedFiltersEmptyState } from "./empty-state";
import { SharedFilters } from "./shared-filters";

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
