import { getUserCategoryHierarchy } from "@/services/queries";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

/**
 * React hook that retrieves the user category hierarchy using a server action query.
 *
 * Returns the result of the query, including data, loading, and error states.
 */
export function useGetUserCategoryHierarchy() {
  return useServerActionQuery(getUserCategoryHierarchy, {
    input: undefined,
    queryKey: ["user-category-hierarchy"],
  });
}
