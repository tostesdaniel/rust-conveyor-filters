"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteCategory } from "@/actions/categoryActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
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
  const queryClient = useQueryClient();
  const { mutate: deleteCategoryMutate } = useServerActionMutation(
    deleteCategory,
    {
      onSuccess: () => {
        toast.success(
          isSubCategory
            ? "Subcategory deleted successfully"
            : "Category deleted successfully",
        );
        queryClient.invalidateQueries({
          queryKey: ["user-filters-by-category", null],
        });
        queryClient.invalidateQueries({
          queryKey: ["user-categories"],
        });
        queryClient.invalidateQueries({
          queryKey: ["user-category-hierarchy"],
        });
      },
      onError: () => {
        toast.error(
          isSubCategory
            ? "Failed to delete subcategory"
            : "Failed to delete category",
        );
      },
    },
  );

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
