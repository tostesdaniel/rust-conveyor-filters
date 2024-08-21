import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RenameCategoryForm } from "@/components/my-filters/categories/forms/rename-category-form";

export interface RenameCategoryDialogProps {
  categoryId: number;
  setOpen: (open: boolean) => void;
}

export function RenameCategoryDialog({
  categoryId,
  setOpen,
}: RenameCategoryDialogProps) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rename Category</DialogTitle>
      </DialogHeader>
      <RenameCategoryForm categoryId={categoryId} setOpen={setOpen} />
    </DialogContent>
  );
}
