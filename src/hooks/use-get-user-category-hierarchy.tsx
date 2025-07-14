import { useServerActionQuery } from "@/hooks/server-action-hooks";
import { getUserCategoryHierarchy } from "@/lib/queries";

export function useGetUserCategoryHierarchy() {
  return useServerActionQuery(getUserCategoryHierarchy, {
    input: undefined,
    queryKey: ["user-category-hierarchy"],
  });
}
