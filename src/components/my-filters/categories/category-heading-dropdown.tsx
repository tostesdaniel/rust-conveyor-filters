"use client";

import { useState } from "react";
import { EllipsisIcon, PencilIcon, TrashIcon } from "lucide-react";

import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteCategoryDialog } from "@/components/my-filters/categories/dialogs/delete-category-dialog";
import { RenameCategoryDialog } from "@/components/my-filters/categories/dialogs/rename-category-dialog";

export function CategoryHeadingDropdown({
  categoryId,
}: {
  categoryId: number;
}) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-8 w-8'
            >
              <EllipsisIcon className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Manage Category</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsRenameDialogOpen(true);
                }}
              >
                <PencilIcon className='mr-2 h-4 w-4' />
                <span>Rename Category</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <RenameCategoryDialog
              categoryId={categoryId}
              setOpen={setIsRenameDialogOpen}
            />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDeleteDialogOpen(true);
                }}
              >
                <TrashIcon className='mr-2 h-4 w-4' />
                <span>Delete Category</span>
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <DeleteCategoryDialog categoryId={categoryId} />
          </DropdownMenuContent>
        </DropdownMenu>
      </Dialog>
    </AlertDialog>
  );
}
