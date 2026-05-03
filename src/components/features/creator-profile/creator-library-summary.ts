import type { CreatorPublicHierarchy } from "@/data/creator-public";

export type CreatorCategoryBucket = {
  id: number;
  name: string;
  count: number;
};

export type CreatorLibrarySummary = {
  uncategorizedCount: number;
  categoryBuckets: CreatorCategoryBucket[];
  categoryCountWithFilters: number;
};

export function summarizeCreatorLibrary(
  hierarchy: CreatorPublicHierarchy,
): CreatorLibrarySummary {
  const uncategorizedCount = hierarchy.uncategorized.length;
  const categoryBuckets = hierarchy.categories
    .map((cat) => {
      const inSubCategories = cat.subCategories.reduce(
        (n, sub) => n + sub.filters.length,
        0,
      );

      const count = cat.filters.length + inSubCategories;

      return { id: cat.id, name: cat.name, count };
    })
    .filter((b) => b.count > 0)
    .slice()
    .sort((a, b) => b.count - a.count);

  return {
    uncategorizedCount,
    categoryBuckets,
    categoryCountWithFilters: categoryBuckets.length,
  };
}
