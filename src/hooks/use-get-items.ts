import { useQuery } from "@tanstack/react-query";

import { getItems } from "@/actions/itemActions";

export function useGetItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: getItems,
    staleTime: 4 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
