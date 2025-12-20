import { api } from "@/trpc/react";

export function useGetCategories() {
  return api.stats.getCategories.useQuery();
}
