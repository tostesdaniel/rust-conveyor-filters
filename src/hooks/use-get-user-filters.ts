import { getFiltersWithItems } from "@/services/queries";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

export function useGetUserFilters() {
  return useServerActionQuery(getFiltersWithItems, {
    queryKey: ["user-filters"],
    input: undefined,
  });
}
