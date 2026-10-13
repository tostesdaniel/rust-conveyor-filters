import type { RouterOutputs } from "@/trpc/react";

type Hierarchy = RouterOutputs["category"]["getHierarchy"];
type FilterNode = Hierarchy[number]["filters"][number];

export interface HierarchyData {
  categories: Hierarchy | undefined;
  uncategorized: FilterNode[] | undefined;
}

export interface FilterLocation {
  categoryId: number | null;
  subCategoryId: number | null;
}

interface NamedCategory {
  id: number;
  name: string;
  subCategories: { id: number; name: string }[];
}

export const UNCATEGORIZED: FilterLocation = {
  categoryId: null,
  subCategoryId: null,
};

export function subCategoryLocation(
  data: HierarchyData,
  subCategoryId: number,
): FilterLocation | null {
  const parent = data.categories?.find((category) =>
    category.subCategories.some((sub) => sub.id === subCategoryId),
  );
  return parent ? { categoryId: parent.id, subCategoryId } : null;
}

function appendFilters(
  bucket: FilterNode[],
  filters: FilterNode[],
  location: FilterLocation,
) {
  const start = bucket.length > 0 ? bucket[bucket.length - 1].order + 1 : 0;
  return [
    ...bucket,
    ...filters.map((filter, index) => ({
      ...filter,
      ...location,
      order: start + index,
    })),
  ];
}

function addFilters(
  data: HierarchyData,
  filters: FilterNode[],
  location: FilterLocation,
): HierarchyData {
  if (location.categoryId === null) {
    return {
      ...data,
      uncategorized:
        data.uncategorized &&
        appendFilters(data.uncategorized, filters, location),
    };
  }
  return {
    ...data,
    categories: data.categories?.map((category) => {
      if (category.id !== location.categoryId) return category;
      if (location.subCategoryId === null) {
        return {
          ...category,
          filters: appendFilters(category.filters, filters, location),
        };
      }
      return {
        ...category,
        subCategories: category.subCategories.map((sub) =>
          sub.id === location.subCategoryId
            ? { ...sub, filters: appendFilters(sub.filters, filters, location) }
            : sub,
        ),
      };
    }),
  };
}

function findFilter(data: HierarchyData, filterId: number) {
  const inCategories = data.categories?.flatMap((category) => [
    ...category.filters,
    ...category.subCategories.flatMap((sub) => sub.filters),
  ]);
  return [...(data.uncategorized ?? []), ...(inCategories ?? [])].find(
    (filter) => filter.id === filterId,
  );
}

export function removeFilter(
  data: HierarchyData,
  filterId: number,
): HierarchyData {
  const keep = (filter: FilterNode) => filter.id !== filterId;
  return {
    uncategorized: data.uncategorized?.filter(keep),
    categories: data.categories?.map((category) => ({
      ...category,
      filters: category.filters.filter(keep),
      subCategories: category.subCategories.map((sub) => ({
        ...sub,
        filters: sub.filters.filter(keep),
      })),
    })),
  };
}

/** Moves a filter to the end of the target bucket, as the server does. */
export function moveFilter(
  data: HierarchyData,
  filterId: number,
  location: FilterLocation,
): HierarchyData {
  const filter = findFilter(data, filterId);
  if (!filter) return data;
  return addFilters(removeFilter(data, filterId), [filter], location);
}

/**
 * Deleting a subcategory moves its filters into the parent category. Deleting
 * a category moves its filters and its subcategories' filters to uncategorized.
 */
export function deleteCategory(
  data: HierarchyData,
  categoryId: number,
  isSubCategory: boolean,
): HierarchyData {
  if (isSubCategory) {
    const location = subCategoryLocation(data, categoryId);
    const filters =
      data.categories
        ?.flatMap((category) => category.subCategories)
        .find((sub) => sub.id === categoryId)?.filters ?? [];
    if (!location?.categoryId) return data;
    return addFilters(
      {
        ...data,
        categories: data.categories?.map((category) => ({
          ...category,
          subCategories: category.subCategories.filter(
            (sub) => sub.id !== categoryId,
          ),
        })),
      },
      filters,
      { categoryId: location.categoryId, subCategoryId: null },
    );
  }

  const category = data.categories?.find(({ id }) => id === categoryId);
  if (!category) return data;
  return addFilters(
    {
      ...data,
      categories: data.categories?.filter(({ id }) => id !== categoryId),
    },
    [
      ...category.filters,
      ...category.subCategories.flatMap((sub) => sub.filters),
    ],
    UNCATEGORIZED,
  );
}

export function withoutCategory<T extends NamedCategory>(
  categories: T[],
  categoryId: number,
  isSubCategory: boolean,
): T[] {
  if (!isSubCategory) {
    return categories.filter((category) => category.id !== categoryId);
  }
  return categories.map((category) => ({
    ...category,
    subCategories: category.subCategories.filter(
      (sub) => sub.id !== categoryId,
    ),
  }));
}

export function renameCategory<T extends NamedCategory>(
  categories: T[],
  categoryId: number,
  isSubCategory: boolean,
  name: string,
): T[] {
  if (!isSubCategory) {
    return categories.map((category) =>
      category.id === categoryId ? { ...category, name } : category,
    );
  }
  return categories.map((category) => ({
    ...category,
    subCategories: category.subCategories.map((sub) =>
      sub.id === categoryId ? { ...sub, name } : sub,
    ),
  }));
}
