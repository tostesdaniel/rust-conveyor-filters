import { getUserCategories } from "@/services/queries";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

/**
 * React hook that retrieves user categories using a server action query.
 *
 * Returns the result of executing the `getUserCategories` query, enabling components to access user category data.
 */
export function useGetUserCategories() {
  return useServerActionQuery(getUserCategories, {
    input: undefined,
    queryKey: ["user-categories"],
  });
}
