import { getUserFilterById } from "@/services/queries";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

/**
 * Fetches a user filter by its ID using a server action query.
 *
 * @param filterId - The unique identifier of the user filter to retrieve
 * @returns The result of the server action query for the specified user filter
 */
export function useGetUserFilter(filterId: number) {
  return useServerActionQuery(getUserFilterById, {
    input: { filterId },
    queryKey: ["user-filter", filterId],
  });
}
