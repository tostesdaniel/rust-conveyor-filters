import { type api } from "@/trpc/react";

type TRPCUtils = ReturnType<typeof api.useUtils>;

export function invalidateMyFilters(utils: TRPCUtils) {
  return Promise.all([
    utils.filter.getAll.invalidate(),
    utils.filter.getByCategory.invalidate(),
    utils.category.getHierarchy.invalidate(),
  ]);
}
