import { useServerActionQuery } from "@/hooks/server-action-hooks";
import { getUserFilterById } from "@/lib/queries";

export function useGetUserFilter(filterId: number) {
  return useServerActionQuery(getUserFilterById, {
    input: { filterId },
    queryKey: ["user-filter", filterId],
  });
}
