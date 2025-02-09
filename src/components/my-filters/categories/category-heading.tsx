"use client";

import { PlusIcon } from "lucide-react";

import type { ConveyorFilter } from "@/types/filter";
import { useFilterSort } from "@/hooks/use-filter-sort";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryHeadingDropdown } from "@/components/my-filters/categories/category-heading-dropdown";
import { CreateCategoryDialog } from "@/components/my-filters/categories/dialogs/create-category-dialog";

import { SortFilterButton } from "../sort-filter-button";
import { UncategorizedHeadingDropdown } from "./uncategorized-heading-dropdown";

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
      <h2 className='text-base leading-6 font-semibold'>{title}</h2>
      {withAction && (
        <div className='mt-3 flex items-center gap-x-2 sm:mt-0 sm:ml-4'>
          <CreateCategoryDialog parentId={null}>
            <Button type='button' variant='ghost' size='sm'>
              <PlusIcon />
              Create Category
            </Button>
          </CreateCategoryDialog>
          {showSortButton && (
            <div className='relative'>
              <SortFilterButton value={sortType} onValueChange={setSortType} />
              <Badge className='absolute -top-5 -right-5 scale-90 rotate-6 bg-[#99ff33] px-1.5 py-0 hover:bg-[#99ff33]/80'>
                New
              </Badge>
            </div>
          )}
          <UncategorizedHeadingDropdown categoryId={null} />
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
