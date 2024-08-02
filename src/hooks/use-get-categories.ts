import { useServerActionQuery } from "@/hooks/server-action-hooks";
import { getCategories } from "@/lib/queries/categories";

export function useGetCategories() {
  return useServerActionQuery(getCategories, {
    queryKey: ["categories"],
    input: undefined,
  });
}
