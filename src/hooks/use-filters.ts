import { useInfiniteQuery } from "@tanstack/react-query";
import type { inferParserType } from "nuqs";

import type { ConveyorFilterWithAuthor } from "@/types/filter";
import type { FilterSortOption } from "@/types/filter-sorting";
import { serializeSearchParams, type searchParams } from "@/lib/search-params";

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
  search,
  categories,
}: {
  sortBy: inferParserType<typeof searchParams>["sort"];
  cursor?: CursorType;
  pageSize: number;
  search: inferParserType<typeof searchParams>["search"];
  categories?: inferParserType<typeof searchParams>["categories"];
}): Promise<FiltersResponse> {
  const nuqsSearchParams = serializeSearchParams({
    search,
    categories,
    sort: sortBy,
  });
  const params = new URLSearchParams(nuqsSearchParams);
  params.set("pageSize", String(pageSize));

  if (cursor) {
    params.set("cursor", JSON.stringify(cursor));
  }

  const response = await fetch(`/api/filters?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch filters");
  }

  return response.json();
}

export function useFilters(
  sortBy: FilterSortOption["value"],
  search: inferParserType<typeof searchParams>["search"],
  categories: inferParserType<typeof searchParams>["categories"],
) {
  return useInfiniteQuery<
    FiltersResponse,
    Error,
    {
      pages: FiltersResponse[];
      pageParams: (CursorType | undefined)[];
    },
    [
      "filters",
      FilterSortOption["value"],
      inferParserType<typeof searchParams>["search"],
      inferParserType<typeof searchParams>["categories"],
    ],
    CursorType
  >({
    queryKey: ["filters", sortBy, search, categories],
    queryFn: ({ pageParam }) =>
      fetchFilters({
        sortBy,
        cursor: pageParam,
        pageSize: 6,
        search,
        categories,
      }),
    initialPageParam: undefined as CursorType | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
