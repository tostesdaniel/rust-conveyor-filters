"use client";

import { api } from "@/trpc/react";
import { ChevronsDown } from "lucide-react";
import { toast } from "sonner";

import type { OwnerFilterDTO } from "@/types/filter";
import type { UserCategory } from "@/db/schema";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import {
  moveFilter,
  subCategoryLocation,
} from "@/components/features/my-filters/hierarchy-cache";
import { useHierarchyCache } from "@/components/features/my-filters/hooks/use-hierarchy-cache";

interface CategoryDropdownCheckboxProps {
  category: UserCategory;
  filter: OwnerFilterDTO;
  isSubCategory?: boolean;
}

export function CategoryDropdownCheckbox({
  category,
  filter,
  isSubCategory = false,
}: CategoryDropdownCheckboxProps) {
  const utils = api.useUtils();
  const hierarchyCache = useHierarchyCache();
  const { mutate: manageFilterCategoryMutation } =
    api.category.manageFilterCategory.useMutation({
      onMutate: ({ filterId, categoryId, isSubCategory }) =>
        hierarchyCache.update((data) => {
          const location = isSubCategory
            ? subCategoryLocation(data, categoryId)
            : { categoryId, subCategoryId: null };
          return location ? moveFilter(data, filterId, location) : data;
        }),
      onSuccess: () => {
        toast.success(`Added to ${category.name}`);
      },
      onError: (_err, _variables, previous) => {
        hierarchyCache.rollback(previous);
        toast.error("Failed to update category");
      },
      onSettled: () =>
        Promise.all([
          hierarchyCache.refetch(),
          utils.filter.getAll.invalidate(),
        ]),
    });

  const checked = isSubCategory
    ? category.id === filter.subCategoryId
    : category.id === filter.categoryId;
  const isDisabled = isSubCategory && category.id === filter.subCategoryId;
  const showChevron = !isSubCategory && filter.subCategoryId;

  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      closeOnClick
      onClick={() => {
        manageFilterCategoryMutation({
          filterId: filter.id,
          categoryId: category.id,
          isSubCategory,
        });
      }}
      disabled={isDisabled}
      customIndicator={
        showChevron ? <ChevronsDown className='size-4' /> : undefined
      }
    >
      {category.name}
    </DropdownMenuCheckboxItem>
  );
}
