"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CategoryHeadingDropdown } from "@/components/my-filters/categories/category-heading-dropdown";
import { CreateCategoryDialog } from "@/components/my-filters/categories/dialogs/create-category-dialog";

export function CategoryHeading({
  title,
  withAction,
  categoryId,
}: {
  title: string;
  withAction?: boolean;
  categoryId?: number;
}) {
  return (
    <div className='border-b border-border pb-5 sm:flex sm:items-center sm:justify-between'>
      <h2 className='text-base font-semibold leading-6'>{title}</h2>
      {withAction && (
        <div className='mt-3 sm:ml-4 sm:mt-0'>
          <CreateCategoryDialog>
            <Button type='button' variant='ghost' size='sm'>
              <PlusIcon className='mr-2 h-4 w-4' />
              Create Category
            </Button>
          </CreateCategoryDialog>
        </div>
      )}
      {!withAction && categoryId && (
        <CategoryHeadingDropdown categoryId={categoryId} />
      )}
    </div>
  );
}
