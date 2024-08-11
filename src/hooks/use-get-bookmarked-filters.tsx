import { getBookmarkedFilters } from "@/actions/bookmark-filter";
import { useServerActionQuery } from "@/hooks/server-action-hooks";

export function useGetBookmarkedFilters() {
  return useServerActionQuery(getBookmarkedFilters, {
    input: undefined,
    queryKey: ["bookmarked-filters"],
  });
}
