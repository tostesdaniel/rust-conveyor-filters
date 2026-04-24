import { api } from "@/trpc/react";

export function useGetUserFilter(filterId: number) {
  return api.filter.getById.useQuery(
    { filterId },
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );
}
