import { getUserCategories } from "@/actions/userCategoryActions";
import { useServerActionQuery } from "@/hooks/server-action-hooks";

export function useGetUserCategories() {
  return useServerActionQuery(getUserCategories, {
    input: undefined,
    queryKey: ["user-categories"],
  });
}
