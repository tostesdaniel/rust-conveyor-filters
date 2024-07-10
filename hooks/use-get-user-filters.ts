import { useQuery } from "@tanstack/react-query";

import { getFiltersWithItems } from "@/lib/queries";

export function useGetUserFilters(userId: string) {
  return useQuery({
    queryKey: ["user-filters", userId],
    queryFn: () => getFiltersWithItems(userId),
  });
}
