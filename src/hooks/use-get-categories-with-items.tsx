import { getCategoriesWithOwnFilters } from "@/actions/categoryActions";
import { useServerActionQuery } from "@/hooks/server-action-hooks";

export function useGetCategoriesWithOwnFilters() {
  return useServerActionQuery(getCategoriesWithOwnFilters, {
    input: undefined,
    queryKey: ["categories-with-own-filters"],
  });
}
