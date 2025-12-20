"use client";

import { useCallback, useMemo, useState } from "react";
import { api } from "@/trpc/react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarArrowDown,
  CalendarArrowUp,
} from "lucide-react";
import { toast } from "sonner";

import type { OwnerFilterDTO, SharedFilterDTO } from "@/types/filter";
import {
  getSavedSortPreference,
  saveSortPreference,
  sortFiltersByPreference,
  type FilterSortTypeValue,
} from "@/lib/utils/filter-sorting";

export type FilterSortType = {
  value: FilterSortTypeValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const filterSortTypes: FilterSortType[] = [
  {
    value: "nameAsc",
    label: "Name (A-Z)",
    icon: ArrowUpAZ,
  },
  {
    value: "nameDesc",
    label: "Name (Z-A)",
    icon: ArrowDownAZ,
  },
  {
    value: "dateAsc",
    label: "Oldest first",
    icon: CalendarArrowUp,
  },
  {
    value: "dateDesc",
    label: "Newest first",
    icon: CalendarArrowDown,
  },
];

interface UseFilterSortProps {
  filters: (OwnerFilterDTO | SharedFilterDTO)[];
  categoryId: number | null;
  subCategoryId: number | null;
}

export function useFilterSort({
  filters,
  categoryId,
  subCategoryId,
}: UseFilterSortProps) {
  const [sortType, setSortType] = useState<FilterSortType["value"]>(() => {
    return getSavedSortPreference(categoryId, subCategoryId);
  });
  const utils = api.useUtils();

  const { mutate: updateOrders } = api.filter.updateOrder.useMutation({
    onSuccess() {
      if (!categoryId && !subCategoryId) {
        utils.filter.getByCategory.invalidate({ categoryId });
      }

      if (categoryId || subCategoryId) {
        utils.category.getHierarchy.invalidate();
      }

      toast.success("Filter order updated");
    },
    onError: () => {
      toast.error("Failed to update filter order");
    },
  });

  const handleSortChange = useCallback(
    (newSortType: FilterSortType["value"]) => {
      setSortType(newSortType);
      saveSortPreference(categoryId, subCategoryId, newSortType);

      const sorted = sortFiltersByPreference(filters, newSortType);

      const filterUpdates = sorted.map((filter, index) => ({
        filterId: filter.id,
        order: index,
      }));

      updateOrders({
        filters: filterUpdates,
        categoryId,
        subCategoryId,
      });
    },
    [categoryId, filters, subCategoryId, updateOrders],
  );

  const sortedFilters = useMemo(() => {
    return sortFiltersByPreference(filters, sortType);
  }, [filters, sortType]);

  return {
    sortType,
    setSortType: handleSortChange,
    sortedFilters,
  };
}
