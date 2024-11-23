"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CategoryHeadingDropdown } from "@/components/my-filters/categories/category-heading-dropdown";
import { CreateCategoryDialog } from "@/components/my-filters/categories/dialogs/create-category-dialog";

interface CategoryHeadingProps {
  title: string;
  withAction?: boolean;
  categoryId?: number;
  isSubCategory?: boolean;
  canCreateSubcategory?: boolean;
}

export function CategoryHeading({
  title,
  withAction = false,
  categoryId,
  isSubCategory = false,
  canCreateSubcategory = false,
}: CategoryHeadingProps) {
  return (
    <div className='border-b border-border pb-5 sm:flex sm:items-center sm:justify-between'>
      <h2 className='text-base font-semibold leading-6'>{title}</h2>
      {withAction && (
        <div className='mt-3 sm:ml-4 sm:mt-0'>
          <CreateCategoryDialog parentId={null}>
            <Button type='button' variant='ghost' size='sm'>
              <PlusIcon />
              Create Category
            </Button>
          </CreateCategoryDialog>
        </div>
      )}
      {!withAction && categoryId && (
        <div className='flex items-center gap-2'>
          {canCreateSubcategory && !isSubCategory && (
            <CreateCategoryDialog parentId={categoryId}>
              <Button type='button' variant='ghost' size='sm'>
                <PlusIcon />
                Add Subcategory
              </Button>
            </CreateCategoryDialog>
          )}
          <CategoryHeadingDropdown
            categoryId={categoryId}
            isSubCategory={isSubCategory}
          />
        </div>
      )}
    </div>
  );
}
