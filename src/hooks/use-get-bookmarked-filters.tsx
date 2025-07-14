import { useServerActionQuery } from "@/hooks/server-action-hooks";
import { getBookmarkedFilters } from "@/lib/queries";

export function useGetBookmarkedFilters() {
  return useServerActionQuery(getBookmarkedFilters, {
    input: undefined,
    queryKey: ["bookmarked-filters"],
  });
}
