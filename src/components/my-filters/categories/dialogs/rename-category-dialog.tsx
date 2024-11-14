import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RenameCategoryForm } from "@/components/my-filters/categories/forms/rename-category-form";

export interface RenameCategoryDialogProps {
  categoryId: number;
  isSubCategory?: boolean;
  setOpen: (open: boolean) => void;
}

export function RenameCategoryDialog({
  categoryId,
  isSubCategory = false,
  setOpen,
}: RenameCategoryDialogProps) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Rename {isSubCategory ? "Subcategory" : "Category"}
        </DialogTitle>
      </DialogHeader>
      <RenameCategoryForm
        categoryId={categoryId}
        isSubCategory={isSubCategory}
        setOpen={setOpen}
      />
    </DialogContent>
  );
}
