import { useQuery } from "@tanstack/react-query";

import type { ConveyorFilterWithAuthor } from "@/types/filter";

export function useGetPublicFilter(filterId?: number) {
  return useQuery<ConveyorFilterWithAuthor>({
    queryKey: ["public-filter", filterId],
    queryFn: async () => {
      if (!filterId) throw new Error("Filter ID is required");
      const response = await fetch(`/api/filters/${filterId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch filter");
      }
      return response.json();
    },
    enabled: !!filterId,
  });
}
