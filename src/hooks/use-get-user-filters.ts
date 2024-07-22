import { useServerActionQuery } from "@/hooks/server-action-hooks";
import { getFiltersWithItems } from "@/lib/queries";

export function useGetUserFilters(userId: string) {
  return useServerActionQuery(getFiltersWithItems, {
    input: { userId },
    queryKey: ["user-filters", userId],
  });
}
