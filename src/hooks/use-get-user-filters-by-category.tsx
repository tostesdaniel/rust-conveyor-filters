import { useServerActionQuery } from "@/hooks/server-action-hooks";
import { getUserFiltersByCategory } from "@/lib/queries/filterQueries";

export function useGetUserFiltersByCategory(categoryId: number | null) {
  return useServerActionQuery(getUserFiltersByCategory, {
    input: { categoryId },
    queryKey: ["user-filters-by-category", categoryId],
  });
}
