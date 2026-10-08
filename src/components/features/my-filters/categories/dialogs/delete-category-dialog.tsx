"use client";

import { api } from "@/trpc/react";
import { toast } from "sonner";

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteCategory,
  withoutCategory,
} from "@/components/features/my-filters/hierarchy-cache";
import { useHierarchyCache } from "@/components/features/my-filters/hooks/use-hierarchy-cache";

interface DeleteCategoryDialogProps {
  categoryId: number;
  isSubCategory?: boolean;
}

export function DeleteCategoryDialog({
  categoryId,
  isSubCategory = false,
}: DeleteCategoryDialogProps) {
  const utils = api.useUtils();
  const hierarchyCache = useHierarchyCache();
  const { mutate: deleteCategoryMutate } = api.category.delete.useMutation({
    onMutate: async ({ categoryId, isSubCategory }) => {
      await utils.category.getAll.cancel();
      const previousCategories = utils.category.getAll.getData();
      utils.category.getAll.setData(
        undefined,
        (categories) =>
          categories && withoutCategory(categories, categoryId, isSubCategory),
      );
      const previousHierarchy = await hierarchyCache.update((data) =>
        deleteCategory(data, categoryId, isSubCategory),
      );
      return { previousCategories, previousHierarchy };
    },
    onSuccess: () => {
      toast.success(
        isSubCategory
          ? "Subcategory deleted successfully"
          : "Category deleted successfully",
      );
    },
    onError: (_err, _variables, previous) => {
      hierarchyCache.rollback(previous?.previousHierarchy);
      utils.category.getAll.setData(undefined, previous?.previousCategories);
      toast.error(
        isSubCategory
          ? "Failed to delete subcategory"
          : "Failed to delete category",
      );
    },
    onSettled: () =>
      Promise.all([
        hierarchyCache.refetch(),
        utils.category.getAll.invalidate(),
        utils.filter.getAll.invalidate(),
      ]),
  });

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Delete {isSubCategory ? "Subcategory" : "Category"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete this{" "}
          {isSubCategory ? "subcategory" : "category"}? All filters in this{" "}
          {isSubCategory ? "subcategory" : "category"} will be uncategorized.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel variant='ghost'>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            deleteCategoryMutate({ categoryId, isSubCategory });
          }}
          variant='destructive'
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
