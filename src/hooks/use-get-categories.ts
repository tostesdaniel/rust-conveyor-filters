import { getCategories } from "@/services/queries/categories";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

/**
 * Provides a hook to fetch and cache category data using a server-side query.
 *
 * @returns The result of the category query, including data, loading, and error states.
 */
export function useGetCategories() {
  return useServerActionQuery(getCategories, {
    queryKey: ["categories"],
    input: undefined,
  });
}
