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

import type { ConveyorFilter } from "@/types/filter";

const SORT_PREFERENCE_KEY = "filter-sort-preferences";

function getSortPreferenceKey(
  categoryId: number | null,
  subCategoryId: number | null,
): string {
  if (subCategoryId) return `sub-${subCategoryId}`;
  if (categoryId) return `cat-${categoryId}`;
  return "uncategorized";
}

function getSavedSortPreferences(): Record<string, FilterSortType["value"]> {
  if (typeof window === "undefined") return {};

  const stored = localStorage.getItem(SORT_PREFERENCE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveSortPreference(key: string, value: FilterSortType["value"]) {
  const preferences = getSavedSortPreferences();
  preferences[key] = value;
  localStorage.setItem(SORT_PREFERENCE_KEY, JSON.stringify(preferences));
}

export type FilterSortType = {
  value: "nameAsc" | "nameDesc" | "dateAsc" | "dateDesc";
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
  filters: ConveyorFilter[];
  categoryId: number | null;
  subCategoryId: number | null;
}

export function useFilterSort({
  filters,
  categoryId,
  subCategoryId,
}: UseFilterSortProps) {
  const preferenceKey = getSortPreferenceKey(categoryId, subCategoryId);

  const [sortType, setSortType] = useState<FilterSortType["value"]>(() => {
    const preferences = getSavedSortPreferences();
    return preferences[preferenceKey] || "nameAsc";
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
      saveSortPreference(preferenceKey, newSortType);

      const sorted = [...filters].sort((a, b) => {
        switch (newSortType) {
          case "nameAsc":
            return a.name.localeCompare(b.name);
          case "nameDesc":
            return b.name.localeCompare(a.name);
          case "dateAsc":
            return a.createdAt.getTime() - b.createdAt.getTime();
          case "dateDesc":
            return b.createdAt.getTime() - a.createdAt.getTime();
        }
      });

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
    [categoryId, filters, preferenceKey, subCategoryId, updateOrders],
  );

  const sortedFilters = useMemo(() => {
    return [...filters].sort((a, b) => {
      switch (sortType) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "dateAsc":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "dateDesc":
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  }, [filters, sortType]);

  return {
    sortType,
    setSortType: handleSortChange,
    sortedFilters,
  };
}
