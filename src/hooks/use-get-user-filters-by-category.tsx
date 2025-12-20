import { api } from "@/trpc/react";

export function useGetUserFiltersByCategory(categoryId: number | null) {
  return api.filter.getByCategory.useQuery({ categoryId });
}
