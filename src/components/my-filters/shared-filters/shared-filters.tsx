"use client";

import { useGetSharedFilters } from "@/hooks/useGetSharedFilters";

import { SharedFiltersEmptyState } from "./empty-state";

export function SharedFilters() {
  const { data: sharedFilters } = useGetSharedFilters();

  if (!sharedFilters?.length) {
    return <SharedFiltersEmptyState />;
  }

  // TODO: Implement shared filters
  return <div>Shared Filters</div>;
}
