"use client";

import { useState } from "react";
import { EllipsisIcon, PencilIcon, ShareIcon, TrashIcon } from "lucide-react";

import { useGetUserCategoryHierarchy } from "@/hooks/use-get-user-category-hierarchy";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteCategoryDialog } from "@/components/features/my-filters/categories/dialogs/delete-category-dialog";
import { RenameCategoryDialog } from "@/components/features/my-filters/categories/dialogs/rename-category-dialog";
import { ShareWithUserDialog } from "@/components/features/my-filters/shared-filters/share-with-user-dialog";

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-8'
            />
          }
        >
          <EllipsisIcon className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent className='min-w-48'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              Manage {isSubCategory ? "Subcategory" : "Category"}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
            <PencilIcon />
            <span>Rename {isSubCategory ? "Subcategory" : "Category"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
            <TrashIcon />
            <span>Delete {isSubCategory ? "Subcategory" : "Category"}</span>
          </DropdownMenuItem>
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

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <RenameCategoryDialog
          categoryId={categoryId}
          isSubCategory={isSubCategory}
          setOpen={setIsRenameDialogOpen}
        />
      </Dialog>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DeleteCategoryDialog
          categoryId={categoryId}
          isSubCategory={isSubCategory}
        />
      </AlertDialog>
      <ShareWithUserDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        setIsDialogOpen={setIsShareDialogOpen}
        categoryId={!isSubCategory ? categoryId : undefined}
        subCategoryId={isSubCategory ? categoryId : undefined}
      />
    </>
  );
}
