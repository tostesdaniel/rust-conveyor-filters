import { api } from "@/trpc/react";

export function useGetUserFilter(filterId: number) {
  return api.filter.getById.useQuery({ filterId });
}
