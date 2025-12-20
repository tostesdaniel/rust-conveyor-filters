import { api } from "@/trpc/react";

export function useGetUserCategoryHierarchy() {
  return api.category.getHierarchy.useQuery();
}
