import { api } from "@/trpc/react";
import { skipToken } from "@tanstack/react-query";

export function useGetPublicFilter(filterId?: number) {
  return api.filter.getPublic.useQuery(filterId ? { filterId } : skipToken);
}
