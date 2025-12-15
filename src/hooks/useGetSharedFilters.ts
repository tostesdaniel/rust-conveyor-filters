import { api } from "@/trpc/react";

export function useGetSharedFilters() {
  return api.sharedFilter.getAll.useQuery();
}
