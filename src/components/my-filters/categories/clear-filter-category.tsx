"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ListXIcon } from "lucide-react";
import { toast } from "sonner";

import type { ConveyorFilter } from "@/types/filter";
import { clearFilterCategory } from "@/actions/categoryActions";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ClearFilterCategory({ filter }: { filter: ConveyorFilter }) {
  const queryClient = useQueryClient();
  const { mutate: clearCategory } = useServerActionMutation(
    clearFilterCategory,
    {
      onSuccess: () => {
        toast.success("Filter category cleared");
        queryClient.invalidateQueries({
          queryKey: ["categories-with-own-filters"],
        });
        queryClient.invalidateQueries({
          queryKey: ["user-filters-by-category", null],
        });
      },
      onError: () => {
        toast.error("Failed to clear filter category");
      },
    },
  );
  const handleClearCategory = () => {
    clearCategory({ filterId: filter.id });
  };

  return (
    <DropdownMenuItem
      className='flex items-center'
      onSelect={handleClearCategory}
      disabled={!filter.categoryId}
    >
      <ListXIcon className='mr-2 h-4 w-4' />
      Clear category
    </DropdownMenuItem>
  );
}
