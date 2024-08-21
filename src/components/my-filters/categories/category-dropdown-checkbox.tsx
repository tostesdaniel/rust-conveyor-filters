"use client";

import { useState } from "react";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
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
}

export function CategoryDropdownCheckbox({
  category,
  filter,
}: CategoryDropdownCheckboxProps) {
  const [checked, setChecked] = useState<Checked>(
    category.id === filter.categoryId,
  );
  const queryClient = useQueryClient();
  const { mutate: manageFilterCategoryMutation } = useServerActionMutation(
    manageFilterCategory,
    {
      onSuccess: () => {
        toast.success(`Added to ${category.name}`);
        queryClient.invalidateQueries({
          queryKey: ["categories-with-own-filters"],
        });
        queryClient.invalidateQueries({
          queryKey: ["user-filters-by-category"],
        });
      },
      onError: () => {
        toast.error("Failed to update category");
      },
    },
  );

  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onCheckedChange={setChecked}
      onSelect={() => {
        manageFilterCategoryMutation({
          filterId: filter.id,
          categoryId: category.id,
        });
      }}
      disabled={category.id === filter.categoryId}
    >
      {category.name}
    </DropdownMenuCheckboxItem>
  );
}
