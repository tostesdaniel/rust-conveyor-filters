import { useServerActionQuery } from "@/hooks/server-action-hooks";
import { getFiltersWithItems } from "@/lib/queries";

export function useGetUserFilters() {
  return useServerActionQuery(getFiltersWithItems, {
    queryKey: ["user-filters"],
    input: undefined,
  });
}
