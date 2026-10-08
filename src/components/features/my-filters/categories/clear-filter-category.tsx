"use client";

import { api } from "@/trpc/react";
import { ListXIcon } from "lucide-react";
import { toast } from "sonner";

import type { OwnerFilterDTO } from "@/types/filter";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  moveFilter,
  UNCATEGORIZED,
} from "@/components/features/my-filters/hierarchy-cache";
import { useHierarchyCache } from "@/components/features/my-filters/hooks/use-hierarchy-cache";

interface ClearFilterCategoryProps {
  filter: OwnerFilterDTO;
  isSubCategory?: boolean;
}

export function ClearFilterCategory({
  filter,
  isSubCategory = false,
}: ClearFilterCategoryProps) {
  const utils = api.useUtils();
  const hierarchyCache = useHierarchyCache();
  const { mutate: clearCategory } =
    api.category.clearFilterCategory.useMutation({
      onMutate: ({ filterId }) =>
        hierarchyCache.update((data) =>
          moveFilter(
            data,
            filterId,
            filter.subCategoryId
              ? { categoryId: filter.categoryId, subCategoryId: null }
              : UNCATEGORIZED,
          ),
        ),
      onSuccess: () => {
        toast.success("Filter category cleared");
      },
      onError: (_err, _variables, previous) => {
        hierarchyCache.rollback(previous);
        toast.error("Failed to clear filter category");
      },
      onSettled: () =>
        Promise.all([
          hierarchyCache.refetch(),
          utils.filter.getAll.invalidate(),
        ]),
    });

  const handleClearCategory = () => {
    clearCategory({ filterId: filter.id, isSubCategory });
  };
  const isDisabled = isSubCategory ? !filter.subCategoryId : !filter.categoryId;

  return (
    <DropdownMenuItem
      className='flex items-center'
      onClick={handleClearCategory}
      disabled={isDisabled}
    >
      <ListXIcon />
      Clear {isSubCategory ? "subcategory" : "category"}
    </DropdownMenuItem>
  );
}
