import { getUserCategories } from "@/services/queries";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

export function useGetUserCategories() {
  return useServerActionQuery(getUserCategories, {
    input: undefined,
    queryKey: ["user-categories"],
  });
}
