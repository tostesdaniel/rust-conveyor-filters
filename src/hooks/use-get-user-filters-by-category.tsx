import { useQuery } from "@tanstack/react-query";

import type { ConveyorFilter } from "@/types/filter";

export function useGetUserFiltersByCategory(categoryId: number | null) {
  return useQuery<ConveyorFilter[]>({
    queryKey: ["user-filters-by-category", categoryId],
    queryFn: async () => {
      const response = await fetch(
        `/api/filters/by-category?categoryId=${categoryId ?? ""}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch filters");
      }
      return response.json();
    },
  });
}
