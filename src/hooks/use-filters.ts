import { api } from "@/trpc/react";
import type { inferParserType } from "nuqs";

import type { FilterSortOption } from "@/types/filter-sorting";
import { type searchParams } from "@/config/search-params";

export function useFilters(
  sortBy: FilterSortOption["value"],
  search: inferParserType<typeof searchParams>["search"],
  categories: inferParserType<typeof searchParams>["categories"],
  items: inferParserType<typeof searchParams>["items"],
) {
  return api.filter.getPublicListInfinite.useInfiniteQuery(
    {
      sort: sortBy,
      pageSize: 6,
      search: search || undefined,
      categories: categories || undefined,
      items: items || undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  );
}
