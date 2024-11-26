import { useServerActionQuery } from "@/hooks/server-action-hooks";
import { getPublicFilter } from "@/lib/queries/filterQueries";

export function useGetPublicFilter(filterId?: number) {
  return useServerActionQuery(getPublicFilter, {
    input: filterId ? { filterId } : undefined,
    queryKey: ["public-filter", filterId],
    enabled: !!filterId,
  });
}
