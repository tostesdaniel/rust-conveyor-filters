import type { ConveyorFilter } from "@/types/filter";

export type FilterSortTypeValue =
  | "nameAsc"
  | "nameDesc"
  | "dateAsc"
  | "dateDesc";

export const SORT_PREFERENCE_KEY = "filter-sort-preferences";

/**
 * Generate the localStorage key for a category/subcategory sort preference
 */
export function getSortPreferenceKey(
  categoryId: number | null,
  subCategoryId: number | null,
): string {
  if (subCategoryId) return `sub-${subCategoryId}`;
  if (categoryId) return `cat-${categoryId}`;
  return "uncategorized";
}

/**
 * Get all saved sort preferences from localStorage
 */
function getSavedSortPreferences(): Record<string, FilterSortTypeValue> {
  if (typeof window === "undefined") return {};

  const stored = localStorage.getItem(SORT_PREFERENCE_KEY);
  return stored ? JSON.parse(stored) : {};
}

/**
 * Get the saved sort preference for a specific category/subcategory
 */
export function getSavedSortPreference(
  categoryId: number | null,
  subCategoryId: number | null,
): FilterSortTypeValue {
  const preferences = getSavedSortPreferences();
  const key = getSortPreferenceKey(categoryId, subCategoryId);
  return preferences[key] || "nameAsc";
}

/**
 * Save a sort preference for a specific category/subcategory
 */
export function saveSortPreference(
  categoryId: number | null,
  subCategoryId: number | null,
  value: FilterSortTypeValue,
): void {
  const preferences = getSavedSortPreferences();
  const key = getSortPreferenceKey(categoryId, subCategoryId);
  preferences[key] = value;
  localStorage.setItem(SORT_PREFERENCE_KEY, JSON.stringify(preferences));
}

/**
 * Sort an array of filters according to a sort type
 */
export function sortFiltersByPreference(
  filters: ConveyorFilter[],
  sortType: FilterSortTypeValue,
): ConveyorFilter[] {
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
}
