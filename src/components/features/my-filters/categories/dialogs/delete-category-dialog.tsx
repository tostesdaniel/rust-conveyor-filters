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

interface DeleteCategoryDialogProps {
  categoryId: number;
  isSubCategory?: boolean;
}

export function DeleteCategoryDialog({
  categoryId,
  isSubCategory = false,
}: DeleteCategoryDialogProps) {
  const utils = api.useUtils();
  const { mutate: deleteCategoryMutate } = api.category.delete.useMutation({
    onSuccess: () => {
      toast.success(
        isSubCategory
          ? "Subcategory deleted successfully"
          : "Category deleted successfully",
      );
      utils.filter.getByCategory.invalidate({ categoryId: null });
      utils.category.getAll.invalidate();
      utils.category.getHierarchy.invalidate();
    },
    onError: () => {
      toast.error(
        isSubCategory
          ? "Failed to delete subcategory"
          : "Failed to delete category",
      );
    },
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
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            deleteCategoryMutate({ categoryId, isSubCategory });
          }}
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
