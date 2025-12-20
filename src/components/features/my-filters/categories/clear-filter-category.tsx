"use client";

import { api } from "@/trpc/react";
import { ListXIcon } from "lucide-react";
import { toast } from "sonner";

import type { OwnerFilterDTO } from "@/types/filter";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface ClearFilterCategoryProps {
  filter: OwnerFilterDTO;
  isSubCategory?: boolean;
}

export function ClearFilterCategory({
  filter,
  isSubCategory = false,
}: ClearFilterCategoryProps) {
  const utils = api.useUtils();
  const { mutate: clearCategory } =
    api.category.clearFilterCategory.useMutation({
      onSuccess: () => {
        toast.success("Filter category cleared");
        utils.filter.getByCategory.invalidate({ categoryId: null });
        utils.category.getHierarchy.invalidate();
      },
      onError: () => {
        toast.error("Failed to clear filter category");
      },
    });

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
