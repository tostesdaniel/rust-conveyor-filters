import { getUserCategoryHierarchy } from "@/actions/userCategoryActions";
import { useServerActionQuery } from "@/hooks/server-action-hooks";

export function useGetUserCategoryHierarchy() {
  return useServerActionQuery(getUserCategoryHierarchy, {
    input: undefined,
    queryKey: ["user-category-hierarchy"],
  });
}
