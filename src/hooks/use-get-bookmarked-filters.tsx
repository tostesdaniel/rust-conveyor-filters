import { getBookmarkedFilters } from "@/services/queries";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

/**
 * Custom React hook that retrieves bookmarked filters using a server-side query.
 *
 * Returns the result of querying for bookmarked filters, including loading and error states.
 */
export function useGetBookmarkedFilters() {
  return useServerActionQuery(getBookmarkedFilters, {
    input: undefined,
    queryKey: ["bookmarked-filters"],
  });
}
