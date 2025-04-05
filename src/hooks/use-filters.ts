import { useInfiniteQuery } from "@tanstack/react-query";

import type { ConveyorFilterWithAuthor } from "@/types/filter";
import type { FilterSortOption } from "@/types/filter-sorting";

interface FiltersResponse {
  data: ConveyorFilterWithAuthor[];
  nextCursor?: {
    id: number;
    popularityScore?: number;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

type CursorType = FiltersResponse["nextCursor"];

async function fetchFilters({
  sortBy,
  cursor,
  pageSize,
}: {
  sortBy: FilterSortOption["value"];
  cursor?: CursorType;
  pageSize: number;
}): Promise<FiltersResponse> {
  const params = new URLSearchParams({
    sortBy,
    pageSize: String(pageSize),
  });

  if (cursor) {
    params.set("cursor", JSON.stringify(cursor));
  }

  const response = await fetch(`/api/filters?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch filters");
  }

  return response.json();
}

export function useFilters(sortBy: FilterSortOption["value"]) {
  return useInfiniteQuery<
    FiltersResponse,
    Error,
    {
      pages: FiltersResponse[];
      pageParams: (CursorType | undefined)[];
    },
    ["filters", string],
    CursorType
  >({
    queryKey: ["filters", sortBy],
    queryFn: ({ pageParam }) =>
      fetchFilters({
        sortBy,
        cursor: pageParam,
        pageSize: 6,
      }),
    initialPageParam: undefined as CursorType | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
