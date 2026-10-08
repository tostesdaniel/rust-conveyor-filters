"use client";

import { api } from "@/trpc/react";
import { useQueryClient } from "@tanstack/react-query";
import { getMutationKey } from "@trpc/react-query";

import type { HierarchyData } from "@/components/features/my-filters/hierarchy-cache";

const HIERARCHY_MUTATION_KEYS = [
  getMutationKey(api.filter.moveToPosition),
  getMutationKey(api.filter.delete),
  getMutationKey(api.category.updateOrder),
  getMutationKey(api.category.updateSubCategoryOrder),
  getMutationKey(api.category.manageFilterCategory),
  getMutationKey(api.category.clearFilterCategory),
  getMutationKey(api.category.delete),
];

/** Optimistic writes to the category hierarchy and uncategorized filter caches. */
export function useHierarchyCache() {
  const utils = api.useUtils();
  const queryClient = useQueryClient();

  const cancel = () =>
    Promise.all([
      utils.category.getHierarchy.cancel(),
      utils.filter.getByCategory.cancel({ categoryId: null }),
    ]);

  const write = (data: HierarchyData) => {
    utils.category.getHierarchy.setData(undefined, data.categories);
    utils.filter.getByCategory.setData(
      { categoryId: null },
      data.uncategorized,
    );
  };

  // Called from a mutation's own callbacks, so that mutation counts as one.
  const othersSaving = () =>
    HIERARCHY_MUTATION_KEYS.reduce(
      (count, mutationKey) => count + queryClient.isMutating({ mutationKey }),
      0,
    ) > 1;

  /** Applies the change and returns the previous data for `rollback`. */
  const update = async (change: (data: HierarchyData) => HierarchyData) => {
    await cancel();
    const previous: HierarchyData = {
      categories: utils.category.getHierarchy.getData(),
      uncategorized: utils.filter.getByCategory.getData({ categoryId: null }),
    };
    write(change(previous));
    return previous;
  };

  // With other changes in flight the snapshot is stale, so leave it to the refetch.
  const rollback = (previous: HierarchyData | undefined) => {
    if (previous && !othersSaving()) write(previous);
  };

  const refetch = () => {
    if (othersSaving()) return;
    return Promise.all([
      utils.category.getHierarchy.invalidate(),
      utils.filter.getByCategory.invalidate({ categoryId: null }),
    ]);
  };

  return { cancel, update, rollback, refetch };
}
