"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ListXIcon } from "lucide-react";
import { toast } from "sonner";

import type { ConveyorFilter } from "@/types/filter";
import { clearFilterCategory } from "@/actions/categoryActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface ClearFilterCategoryProps {
  filter: ConveyorFilter;
  isSubCategory?: boolean;
}

export function ClearFilterCategory({
  filter,
  isSubCategory = false,
}: ClearFilterCategoryProps) {
  const queryClient = useQueryClient();
  const { mutate: clearCategory } = useServerActionMutation(
    clearFilterCategory,
    {
      onSuccess: () => {
        toast.success("Filter category cleared");
        queryClient.invalidateQueries({
          queryKey: ["user-filters-by-category", null],
        });
        queryClient.invalidateQueries({
          queryKey: ["user-category-hierarchy"],
        });
      },
      onError: () => {
        toast.error("Failed to clear filter category");
      },
    },
  );

  const handleClearCategory = () => {
    clearCategory({ filterId: filter.id, isSubCategory });
  };
  const isDisabled = isSubCategory ? !filter.subCategoryId : !filter.categoryId;

  return (
    <DropdownMenuItem
      className='flex items-center'
      onSelect={handleClearCategory}
      disabled={isDisabled}
    >
      <ListXIcon />
      Clear {isSubCategory ? "subcategory" : "category"}
    </DropdownMenuItem>
  );
}
