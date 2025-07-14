import { getCategories } from "@/services/queries/categories";

import { useServerActionQuery } from "@/hooks/server-action-hooks";

export function useGetCategories() {
  return useServerActionQuery(getCategories, {
    queryKey: ["categories"],
    input: undefined,
  });
}
