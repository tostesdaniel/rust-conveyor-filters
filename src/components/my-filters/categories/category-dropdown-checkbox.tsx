"use client";

import { useState } from "react";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronsDown } from "lucide-react";
import { toast } from "sonner";

import type { ConveyorFilter } from "@/types/filter";
import { manageFilterCategory } from "@/actions/categoryActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import type { UserCategory } from "@/db/schema";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

type Checked = DropdownMenuCheckboxItemProps["checked"];

interface CategoryDropdownCheckboxProps {
  category: UserCategory;
  filter: ConveyorFilter;
  isSubCategory?: boolean;
}

export function CategoryDropdownCheckbox({
  category,
  filter,
  isSubCategory = false,
}: CategoryDropdownCheckboxProps) {
  const [checked, setChecked] = useState<Checked>(
    isSubCategory
      ? category.id === filter.subCategoryId
      : category.id === filter.categoryId,
  );
  const queryClient = useQueryClient();
  const { mutate: manageFilterCategoryMutation } = useServerActionMutation(
    manageFilterCategory,
    {
      onSuccess: () => {
        toast.success(`Added to ${category.name}`);
        queryClient.invalidateQueries({
          queryKey: ["user-filters-by-category", null],
        });
        queryClient.invalidateQueries({
          queryKey: ["user-category-hierarchy"],
        });
      },
      onError: () => {
        toast.error("Failed to update category");
      },
    },
  );

  const isDisabled = isSubCategory && category.id === filter.subCategoryId;
  const showChevron = !isSubCategory && filter.subCategoryId;

  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onCheckedChange={setChecked}
      onSelect={() => {
        manageFilterCategoryMutation({
          filterId: filter.id,
          categoryId: category.id,
          isSubCategory,
        });
      }}
      disabled={isDisabled}
      customIndicator={
        showChevron ? <ChevronsDown className='h-4 w-4' /> : undefined
      }
    >
      {category.name}
    </DropdownMenuCheckboxItem>
  );
}
