import { api } from "@/trpc/react";

export function useGetUserFilters() {
  return api.filter.getAll.useQuery();
}
