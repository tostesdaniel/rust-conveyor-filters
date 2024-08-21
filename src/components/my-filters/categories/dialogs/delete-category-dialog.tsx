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

export function DeleteCategoryDialog({ categoryId }: { categoryId: number }) {
  const queryClient = useQueryClient();
  const { mutate: deleteCategoryMutate } = useServerActionMutation(
    deleteCategory,
    {
      onSuccess: () => {
        toast.success("Category deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["user-categories"] });
        queryClient.invalidateQueries({
          queryKey: ["categories-with-own-filters"],
        });
        queryClient.invalidateQueries({
          queryKey: ["user-filters-by-category"],
        });
      },
      onError: () => {
        toast.error("Failed to delete category");
      },
    },
  );

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Category</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete this category? This action can&apos;t
          be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => {
            deleteCategoryMutate({ categoryId });
          }}
        >
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
