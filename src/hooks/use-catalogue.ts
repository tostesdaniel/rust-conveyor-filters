import * as React from "react";

import { useGetItems } from "@/hooks/use-get-items";

export function useCatalogue() {
  const { data: items } = useGetItems();
  return React.useMemo(() => {
    const list = items ?? [];
    return {
      byId: new Map(list.map((item) => [item.id, item])),
      byShortname: new Map(list.map((item) => [item.shortname, item])),
    };
  }, [items]);
}
