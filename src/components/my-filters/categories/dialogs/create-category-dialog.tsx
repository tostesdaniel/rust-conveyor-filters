"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateCategoryForm } from "@/components/my-filters/categories/forms/create-category-form";

interface CreateCategoryDialogProps {
  children: React.ReactNode;
  parentId: number | null;
}

export function CreateCategoryDialog({
  children,
  parentId,
}: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {parentId ? "Add Subcategory" : "Create Category"}
          </DialogTitle>
        </DialogHeader>
        <CreateCategoryForm setOpen={setOpen} parentId={parentId} />
      </DialogContent>
    </Dialog>
  );
}
