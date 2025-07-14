import { getUserFilterById } from "@/services/queries";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

export function useGetUserFilter(filterId: number) {
  return useServerActionQuery(getUserFilterById, {
    input: { filterId },
    queryKey: ["user-filter", filterId],
  });
}
