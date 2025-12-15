import { api } from "@/trpc/react";

export function useGetUserCategories() {
  return api.category.getAll.useQuery();
}
