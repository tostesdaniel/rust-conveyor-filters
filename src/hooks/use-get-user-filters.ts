import { getFiltersWithItems } from "@/services/queries";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

/**
 * React hook that fetches user filters along with their associated items.
 *
 * Returns the query result for user filters, including loading and error states.
 */
export function useGetUserFilters() {
  return useServerActionQuery(getFiltersWithItems, {
    queryKey: ["user-filters"],
    input: undefined,
  });
}
