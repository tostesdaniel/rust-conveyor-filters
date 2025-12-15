import { api } from "@/trpc/react";

export function useGetBookmarkedFilters() {
  return api.bookmark.getAll.useQuery();
}
