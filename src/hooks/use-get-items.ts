import { api } from "@/trpc/react";

export function useGetItems() {
  return api.stats.getItems.useQuery(undefined, {
    staleTime: 4 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
