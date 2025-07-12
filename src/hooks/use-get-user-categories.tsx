import { useServerActionQuery } from "@/hooks/server-action-hooks";
import { getUserCategories } from "@/lib/queries";

export function useGetUserCategories() {
  return useServerActionQuery(getUserCategories, {
    input: undefined,
    queryKey: ["user-categories"],
  });
}
