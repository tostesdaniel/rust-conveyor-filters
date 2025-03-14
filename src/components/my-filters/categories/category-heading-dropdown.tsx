"use client";

import { useState } from "react";
import { EllipsisIcon, PencilIcon, ShareIcon, TrashIcon } from "lucide-react";

import { useGetUserCategoryHierarchy } from "@/hooks/use-get-user-category-hierarchy";
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

import { ShareWithUserDialog } from "../shared-filters/share-with-user-dialog";

interface CategoryHeadingDropdownProps {
  categoryId: number;
  isSubCategory?: boolean;
}

export function CategoryHeadingDropdown({
  categoryId,
  isSubCategory = false,
}: CategoryHeadingDropdownProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { data: categoryHierarchy = [] } = useGetUserCategoryHierarchy();

  const evalCategoryHasFilters = () => {
    const category = categoryHierarchy.find((c) => c.id === categoryId);

    if (isSubCategory) {
      return categoryHierarchy.some((c) =>
        c.subCategories.some(
          (sc) => sc.id === categoryId && sc.filters.length > 0,
        ),
      );
    }

    return Boolean(category?.filters.length);
  };

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
            <DropdownMenuLabel>
              Manage {isSubCategory ? "Subcategory" : "Category"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsRenameDialogOpen(true);
                }}
              >
                <PencilIcon />
                <span>Rename {isSubCategory ? "Subcategory" : "Category"}</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <RenameCategoryDialog
              categoryId={categoryId}
              isSubCategory={isSubCategory}
              setOpen={setIsRenameDialogOpen}
            />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsDeleteDialogOpen(true);
                }}
              >
                <TrashIcon />
                <span>Delete {isSubCategory ? "Subcategory" : "Category"}</span>
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <DeleteCategoryDialog
              categoryId={categoryId}
              isSubCategory={isSubCategory}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsShareDialogOpen(true)}
              disabled={!evalCategoryHasFilters()}
            >
              <ShareIcon />
              <span>Share {isSubCategory ? "Subcategory" : "Category"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ShareWithUserDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          setIsDialogOpen={setIsShareDialogOpen}
          categoryId={!isSubCategory ? categoryId : undefined}
          subCategoryId={isSubCategory ? categoryId : undefined}
        />
      </Dialog>
    </AlertDialog>
  );
}
