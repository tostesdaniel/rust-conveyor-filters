"use client";

import { PlusIcon } from "lucide-react";

import type { ConveyorFilter } from "@/types/filter";
import { useFilterSort } from "@/hooks/use-filter-sort";
import { Button } from "@/components/ui/button";
import { CategoryHeadingDropdown } from "@/components/my-filters/categories/category-heading-dropdown";
import { CreateCategoryDialog } from "@/components/my-filters/categories/dialogs/create-category-dialog";

import { SortFilterButton } from "../sort-filter-button";

interface CategoryHeadingProps {
  title: string;
  withAction?: boolean;
  categoryId?: number;
  isSubCategory?: boolean;
  canCreateSubcategory?: boolean;
  filters: ConveyorFilter[];
}

export function CategoryHeading({
  title,
  withAction = false,
  categoryId,
  isSubCategory = false,
  canCreateSubcategory = false,
  filters,
}: CategoryHeadingProps) {
  const { sortType, setSortType } = useFilterSort({
    filters,
    categoryId: categoryId ?? null,
    subCategoryId: isSubCategory
      ? (filters.find((filter) => filter.categoryId === categoryId)
          ?.subCategoryId ?? null)
      : null,
  });
  const showSortButton = filters.length > 1;

  return (
    <div className='border-b border-border pb-5 sm:flex sm:items-center sm:justify-between'>
      <h2 className='text-base font-semibold leading-6'>{title}</h2>
      {withAction && (
        <div className='mt-3 flex items-center gap-x-2 sm:ml-4 sm:mt-0'>
          <CreateCategoryDialog parentId={null}>
            <Button type='button' variant='ghost' size='sm'>
              <PlusIcon />
              Create Category
            </Button>
          </CreateCategoryDialog>
          {showSortButton && (
            <SortFilterButton value={sortType} onValueChange={setSortType} />
          )}
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
          {showSortButton && (
            <SortFilterButton value={sortType} onValueChange={setSortType} />
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
