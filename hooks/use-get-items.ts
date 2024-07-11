import { useQuery } from "@tanstack/react-query";

import { getItems } from "@/actions/itemActions";

export function useGetItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });
}
