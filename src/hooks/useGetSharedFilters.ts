import { getSharedFilters } from "@/lib/queries";

import { useServerActionQuery } from "./server-action-hooks";

export function useGetSharedFilters() {
  return useServerActionQuery(getSharedFilters, {
    queryKey: ["shared-filters"],
    input: undefined,
  });
}
