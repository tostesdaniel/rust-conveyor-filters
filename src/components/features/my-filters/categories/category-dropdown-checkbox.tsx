"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { ChevronsDown } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { toast } from "sonner";

import type { ConveyorFilter } from "@/types/filter";
import type { UserCategory } from "@/db/schema";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

type DropdownMenuCheckboxItemProps = React.ComponentProps<
  typeof DropdownMenuPrimitive.CheckboxItem
>;

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
  const [checked, setChecked] = useState<
    DropdownMenuCheckboxItemProps["checked"]
  >(
    isSubCategory
      ? category.id === filter.subCategoryId
      : category.id === filter.categoryId,
  );
  const utils = api.useUtils();
  const { mutate: manageFilterCategoryMutation } =
    api.category.manageFilterCategory.useMutation({
      onSuccess: () => {
        toast.success(`Added to ${category.name}`);
        utils.filter.getByCategory.invalidate({ categoryId: null });
        utils.category.getHierarchy.invalidate();
      },
      onError: () => {
        toast.error("Failed to update category");
      },
    });

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
